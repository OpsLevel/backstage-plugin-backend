# Threat Model: OpsLevel Backstage Backend Plugin

**Version:** 1.0
**Last Updated:** 2024-01-19
**Owner:** Security Team
**Status:** Active

---

## Executive Summary

This document provides a comprehensive threat analysis of the OpsLevel Backstage Backend Plugin, which facilitates automated synchronization of users, groups, and components from Backstage to OpsLevel. The plugin exposes REST API endpoints, manages scheduled data exports, and maintains database state for configuration and audit trails.

---

## System Architecture Overview

### Components

1. **OpsLevelBuilder** (`OpsLevelBuilder.ts`)
   - Backstage plugin initialization and registration
   - Dependency injection and service wiring
   - Database migration orchestration

2. **OpsLevelController** (`OpsLevelController.ts`)
   - Business logic coordinator
   - Auto-sync scheduling and execution
   - Entity export orchestration
   - Export run state management

3. **OpsLevelGraphqlAPI** (`OpsLevelGraphqlAPI.ts`)
   - GraphQL client for OpsLevel API
   - Rate limiting implementation
   - Retry logic for API failures
   - Entity export requests

4. **Router** (`router.ts`)
   - REST API endpoint definitions
   - Request validation
   - Configuration management endpoints
   - Export run history endpoints

5. **OpsLevelDatabase** (`OpsLevelDatabase.ts`)
   - Database abstraction layer
   - Configuration persistence
   - Export run tracking
   - Transaction management

6. **Database Migrations** (`migrations.ts`)
   - Schema management
   - Database versioning

### Data Flows

```
┌──────────────┐
│   Backstage  │
│   Catalog    │
└──────┬───────┘
       │
       ├─────> OpsLevelController ─────> OpsLevelGraphqlAPI ────> OpsLevel
       │                                                             (External)
       │
       └─────> OpsLevelDatabase
                     │
                     └─────> PostgreSQL/SQLite
```

**API Flow:**
```
External Client ──> /api/opslevel/** ──> Router ──> OpsLevelController ──> Database/OpsLevel
```

### Trust Boundaries

1. **External Network → Backstage API Gateway**
   - Clients making API requests to configure or trigger exports

2. **Backstage Internal → OpsLevel External API**
   - GraphQL requests to OpsLevel API endpoint via proxy

3. **Application → Database**
   - Database queries for configuration and state management

4. **Application → Backstage Catalog API**
   - Internal service-to-service communication

---

## Assets and Data Classification

### Critical Assets

1. **OpsLevel API Token** (CRITICAL)
   - Stored in: `app-config.yaml` configuration
   - Usage: Authorization header for GraphQL API requests
   - Impact if compromised: Full access to OpsLevel tenant

2. **Backstage Catalog Data** (HIGH)
   - Users, groups, and component metadata
   - May contain organizational structure
   - May include service ownership information

3. **Database Credentials** (CRITICAL)
   - Connection strings and authentication
   - Access to configuration and audit data

4. **Export Run History** (MEDIUM)
   - Audit trail of synchronization activities
   - Contains timestamps and operational metadata

5. **Auto-sync Configuration** (MEDIUM)
   - Schedule settings (cron expressions)
   - Enable/disable state

### Data Classification

| Data Type | Classification | Storage Location | Encryption Required |
|-----------|---------------|------------------|---------------------|
| OpsLevel API Token | SECRET | app-config.yaml | Yes (at rest & transit) |
| Database Credentials | SECRET | Environment/Config | Yes (at rest & transit) |
| Catalog Entities | CONFIDENTIAL | In-memory | Yes (in transit) |
| Export Run Logs | INTERNAL | Database | Yes (in transit) |
| Auto-sync Config | INTERNAL | Database | Yes (in transit) |

---

## Threat Analysis (STRIDE)

### Spoofing Threats

#### T-SPOOF-001: API Token Theft
- **Description:** Attacker gains access to OpsLevel API token from configuration files
- **Attack Vector:**
  - Unauthorized file system access
  - Configuration file leakage in logs or backups
  - Exposure via environment variables
- **Impact:** Full unauthorized access to OpsLevel API
- **Likelihood:** Medium
- **Current Controls:**
  - Configuration management best practices
  - File system permissions
- **Mitigation Recommendations:**
  - Implement secret scanning in CI/CD
  - Use secret management solutions (Vault, AWS Secrets Manager)
  - Rotate API tokens regularly
  - Enable audit logging for token usage in OpsLevel

#### T-SPOOF-002: Unauthorized API Access
- **Description:** Attacker bypasses Backstage authentication to access plugin endpoints
- **Attack Vector:**
  - Missing or weak authentication on `/api/opslevel/**` endpoints
  - Session hijacking
  - JWT token forgery
- **Impact:** Unauthorized configuration changes, data export triggers
- **Likelihood:** Medium
- **Current Controls:**
  - Backstage authentication framework
  - HTTP router middleware
- **Mitigation Recommendations:**
  - Explicitly enforce authentication middleware on all endpoints
  - Implement role-based access control (RBAC)
  - Add request signing for sensitive operations
  - Implement API rate limiting per user

### Tampering Threats

#### T-TAMP-001: Malicious Configuration Modification
- **Description:** Attacker modifies auto-sync configuration to disrupt operations or exfiltrate data
- **Attack Vector:**
  - POST `/api/opslevel/auto_sync` without authorization
  - Direct database manipulation
  - SQL injection vulnerabilities
- **Impact:** Denial of service, unauthorized data exports, resource exhaustion
- **Likelihood:** Medium
- **Current Controls:**
  - Cron expression validation
  - Frequency limits (hourly minimum)
  - Input validation on request body
- **Mitigation Recommendations:**
  - Implement configuration change approval workflow
  - Add audit logging for all configuration changes
  - Implement change detection and alerting
  - Use parameterized queries (already using Knex properly)
  - Add additional authorization checks for administrative operations

#### T-TAMP-002: Entity Data Manipulation
- **Description:** Attacker modifies catalog entities before export to inject malicious data
- **Attack Vector:**
  - Compromised Backstage catalog
  - Man-in-the-middle attacks on catalog API calls
  - Direct entity modification in Backstage
- **Impact:** Data integrity issues in OpsLevel, potential XSS or injection in downstream systems
- **Likelihood:** Low
- **Current Controls:**
  - Backstage catalog permissions
  - Entity validation in Backstage
- **Mitigation Recommendations:**
  - Implement entity validation before export
  - Add checksums or digital signatures to exported entities
  - Monitor for unexpected entity modifications
  - Implement entity schema validation

#### T-TAMP-003: Database Transaction Manipulation
- **Description:** Race conditions or improper transaction handling leads to data corruption
- **Attack Vector:**
  - Concurrent configuration updates
  - Transaction rollback failures
  - Database connection interruptions
- **Impact:** Inconsistent state, lost configuration changes
- **Likelihood:** Low
- **Current Controls:**
  - Transaction wrapping in `setConfigValues` and `upsertExportRun`
  - Knex transaction management
- **Mitigation Recommendations:**
  - Implement optimistic locking
  - Add retry logic for transient failures
  - Implement database connection pooling with proper timeout handling

### Repudiation Threats

#### T-REPU-001: Unauthorized Actions Without Audit Trail
- **Description:** Actions performed without sufficient logging to attribute to specific users
- **Attack Vector:**
  - Missing user context in logs
  - Log tampering or deletion
  - Insufficient log retention
- **Impact:** Inability to investigate security incidents, compliance violations
- **Likelihood:** Medium
- **Current Controls:**
  - Export run logging in database
  - Winston logger integration
- **Mitigation Recommendations:**
  - Add user identity to all log entries
  - Implement immutable audit logs
  - Send logs to centralized SIEM
  - Include IP addresses and timestamps in all audit events
  - Log all configuration changes with before/after values

#### T-REPU-002: Export Run Data Falsification
- **Description:** Attacker modifies export run history to hide malicious activity
- **Attack Vector:**
  - Direct database access
  - SQL injection
  - Application-level database manipulation
- **Impact:** False audit trail, inability to detect compromises
- **Likelihood:** Low
- **Current Controls:**
  - Database access controls
  - Transaction integrity
- **Mitigation Recommendations:**
  - Implement append-only audit tables
  - Add cryptographic signatures to audit records
  - Implement database-level triggers to prevent modifications
  - Regular audit log integrity checks

### Information Disclosure Threats

#### T-INFO-001: Sensitive Data in Logs
- **Description:** API tokens, entity data, or PII leaked through application logs
- **Attack Vector:**
  - Error messages containing sensitive data
  - Debug logging in production
  - Log aggregation systems without access controls
- **Impact:** Credential theft, privacy violations, compliance breaches
- **Likelihood:** Medium
- **Current Controls:**
  - Winston logger configuration
  - Structured logging
- **Mitigation Recommendations:**
  - Implement log scrubbing for sensitive patterns
  - Review all error messages for data leakage
  - Implement separate log levels for production
  - Redact PII and secrets before logging
  - Restrict access to log aggregation systems

#### T-INFO-002: Export Run Details Exposure
- **Description:** Detailed export run information exposes organizational structure or operational details
- **Attack Vector:**
  - Unauthenticated access to `/api/opslevel/auto_sync/runs`
  - Insufficient access controls on run history
- **Impact:** Information leakage about system usage, entity counts, error patterns
- **Likelihood:** Low
- **Current Controls:**
  - API authentication framework
- **Mitigation Recommendations:**
  - Implement field-level authorization
  - Redact sensitive fields for non-admin users
  - Add data retention policies for old export runs
  - Implement pagination limits

#### T-INFO-003: Timing Side-Channel Attacks
- **Description:** Response time variations reveal information about system state or data
- **Attack Vector:**
  - Measuring response times to infer configuration states
  - Using timing to enumerate valid entities
- **Impact:** Information leakage about internal state
- **Likelihood:** Very Low
- **Current Controls:**
  - None specific
- **Mitigation Recommendations:**
  - Implement constant-time comparisons for sensitive operations
  - Add random delays to prevent timing analysis
  - Monitor for unusual request patterns

### Denial of Service Threats

#### T-DOS-001: Resource Exhaustion via Export Operations
- **Description:** Attacker triggers excessive export operations to exhaust system resources
- **Attack Vector:**
  - Rapid export triggers
  - Large entity sets causing memory exhaustion
  - Cron schedule with too-frequent executions
- **Impact:** Service unavailability, database resource exhaustion, OpsLevel API rate limiting
- **Likelihood:** Medium
- **Current Controls:**
  - Cron frequency validation (hourly minimum)
  - 2-hour task timeout
  - OpsLevel API rate limiting (200 RPM)
  - Abort signal handling
- **Mitigation Recommendations:**
  - Implement request rate limiting per user/IP
  - Add circuit breaker for failed exports
  - Implement export queue with concurrency limits
  - Add monitoring and alerting for resource usage
  - Implement backpressure mechanisms

#### T-DOS-002: Database Connection Pool Exhaustion
- **Description:** Uncontrolled database connections exhaust connection pool
- **Attack Vector:**
  - Concurrent export operations
  - Long-running transactions
  - Connection leaks
- **Impact:** Database unavailability, plugin failure
- **Likelihood:** Low
- **Current Controls:**
  - Knex connection pooling
  - Transaction management
- **Mitigation Recommendations:**
  - Configure connection pool limits
  - Implement connection health checks
  - Add query timeouts
  - Monitor connection pool metrics

#### T-DOS-003: OpsLevel API Rate Limit Exhaustion
- **Description:** Plugin triggers rate limiting on OpsLevel API affecting other integrations
- **Attack Vector:**
  - Large entity exports
  - Retry logic amplification
  - Concurrent export attempts
- **Impact:** OpsLevel API unavailability for organization
- **Likelihood:** Low
- **Current Controls:**
  - Rate limiter (200 RPM, below 250 limit)
  - Retry with exponential backoff (3 retries, 20s intervals)
- **Mitigation Recommendations:**
  - Implement adaptive rate limiting based on API responses
  - Add monitoring for 429 responses
  - Implement export batching
  - Add alerting for rate limit approaches

### Elevation of Privilege Threats

#### T-PRIV-001: Unauthorized Administrative Access
- **Description:** Non-admin users gain access to administrative functions
- **Attack Vector:**
  - Missing authorization checks on endpoints
  - Privilege escalation via request manipulation
  - Session token privilege escalation
- **Impact:** Unauthorized configuration changes, data access
- **Likelihood:** Medium
- **Current Controls:**
  - Backstage permission framework
- **Mitigation Recommendations:**
  - Implement explicit permission checks on all endpoints
  - Define admin-only operations (config changes, manual exports)
  - Implement principle of least privilege
  - Add permission-based endpoint filtering
  - Regular permission audits

#### T-PRIV-002: Database Privilege Escalation
- **Description:** Application database user has excessive privileges
- **Attack Vector:**
  - SQL injection leading to privilege escalation
  - Compromised application gaining database admin access
- **Impact:** Full database compromise, data theft, service disruption
- **Likelihood:** Low
- **Current Controls:**
  - Parameterized queries via Knex
  - Transaction management
- **Mitigation Recommendations:**
  - Use dedicated database user with minimal privileges
  - Implement row-level security policies
  - Regular database permission audits
  - Separate read and write database connections

#### T-PRIV-003: Scheduler Privilege Abuse
- **Description:** Scheduled tasks run with excessive privileges or can be manipulated
- **Attack Vector:**
  - Cron expression manipulation to execute at unintended times
  - Task injection via configuration
  - Abort signal manipulation
- **Impact:** Unauthorized operations, resource abuse
- **Likelihood:** Low
- **Current Controls:**
  - Cron expression validation
  - Schedule frequency limits
  - Global scope scheduling
- **Mitigation Recommendations:**
  - Implement task execution auditing
  - Add scheduler-level authorization
  - Monitor for unexpected task executions
  - Implement task signature verification

---

## Attack Vectors and Entry Points

### External Attack Surface

1. **REST API Endpoints**
   - `/api/opslevel/ping` - Health check (low risk)
   - `/api/opslevel/auto_sync` - GET configuration (medium risk)
   - `/api/opslevel/auto_sync` - POST configuration (high risk)
   - `/api/opslevel/auto_sync/runs` - POST query runs (medium risk)

2. **Configuration Files**
   - `app-config.yaml` - Contains OpsLevel API token
   - Environment variables - Database credentials

3. **Network Connections**
   - OpsLevel GraphQL API (`/api/proxy/opslevel/graphql`)
   - Backstage Catalog API
   - Database connection

### Internal Entry Points

1. **Scheduled Tasks**
   - Auto-sync cron job execution
   - Task scheduling/cancellation

2. **Database Queries**
   - Configuration reads/writes
   - Export run history management

3. **Catalog API Interactions**
   - Entity fetching by kind (user, group, component)

### Dependencies and Third-Party Integrations

1. **External Dependencies** (Supply Chain Risks)
   - `@backstage/*` packages - Core Backstage dependencies
   - `express` - Web framework
   - `knex` - Database client
   - `graphql-request` - GraphQL client
   - `cron` - Scheduler
   - `limiter` - Rate limiting

2. **Integration Points**
   - OpsLevel GraphQL API - External SaaS
   - Backstage Catalog - Internal service
   - Database - PostgreSQL/SQLite

---

## Existing Security Controls

### Authentication & Authorization
- ✓ Backstage authentication framework integration
- ✓ Backend plugin API authentication
- ⚠️ Endpoint-level authorization (needs verification)

### Input Validation
- ✓ Cron expression validation using `CronTime`
- ✓ Request body type checking
- ✓ Schedule frequency limits (hourly minimum)
- ✓ Pagination parameter validation

### Data Protection
- ✓ API token in headers (not URL)
- ✓ HTTPS for external API calls (via proxy)
- ⚠️ Secret management (via configuration)

### Error Handling
- ✓ Express error middleware
- ✓ Try-catch blocks in critical sections
- ✓ Transaction rollback on errors
- ✓ GraphQL error handling

### Rate Limiting
- ✓ OpsLevel API rate limiter (200 RPM)
- ✓ Retry with backoff (3 attempts, exponential)
- ⚠️ No per-user request rate limiting

### Audit & Logging
- ✓ Winston logger integration
- ✓ Export run tracking in database
- ✓ Structured logging
- ⚠️ User attribution in logs (needs verification)

### Database Security
- ✓ Parameterized queries via Knex
- ✓ Transaction management
- ✓ Database migrations
- ✓ Connection pooling

### Operational Security
- ✓ Task timeout (2 hours)
- ✓ Abort signal support
- ✓ Global task scope
- ✓ Graceful task cancellation

---

## Threat Mitigation Recommendations

### High Priority (Immediate Action Required)

1. **Implement Secret Management** (T-SPOOF-001)
   - **Action:** Integrate with HashiCorp Vault or cloud secret manager
   - **Timeline:** 2 weeks
   - **Owner:** DevOps Team
   - **Effort:** Medium

2. **Add Endpoint Authorization** (T-PRIV-001, T-SPOOF-002)
   - **Action:** Implement RBAC on all endpoints, especially configuration endpoints
   - **Timeline:** 1 week
   - **Owner:** Development Team
   - **Effort:** Low

3. **Enhance Audit Logging** (T-REPU-001)
   - **Action:** Add user identity, IP address, and before/after values to all logs
   - **Timeline:** 1 week
   - **Owner:** Development Team
   - **Effort:** Low

4. **Implement API Rate Limiting** (T-DOS-001, T-SPOOF-002)
   - **Action:** Add per-user/IP rate limiting on API endpoints
   - **Timeline:** 1 week
   - **Owner:** Development Team
   - **Effort:** Medium

### Medium Priority (Within 30 Days)

5. **Log Scrubbing** (T-INFO-001)
   - **Action:** Implement automated redaction of secrets and PII in logs
   - **Timeline:** 2 weeks
   - **Owner:** Security Team
   - **Effort:** Medium

6. **Entity Validation** (T-TAMP-002)
   - **Action:** Add schema validation for entities before export
   - **Timeline:** 2 weeks
   - **Owner:** Development Team
   - **Effort:** Low

7. **Configuration Change Workflow** (T-TAMP-001)
   - **Action:** Implement approval workflow for configuration changes
   - **Timeline:** 3 weeks
   - **Owner:** Development Team
   - **Effort:** High

8. **Monitoring and Alerting** (T-DOS-001, T-DOS-003)
   - **Action:** Set up alerts for resource usage, rate limits, and errors
   - **Timeline:** 2 weeks
   - **Owner:** SRE Team
   - **Effort:** Medium

### Low Priority (Within 90 Days)

9. **Database Security Hardening** (T-PRIV-002)
   - **Action:** Review and minimize database user privileges
   - **Timeline:** 4 weeks
   - **Owner:** Database Team
   - **Effort:** Low

10. **Immutable Audit Logs** (T-REPU-002)
    - **Action:** Implement append-only audit tables with integrity checks
    - **Timeline:** 6 weeks
    - **Owner:** Development Team
    - **Effort:** Medium

11. **Supply Chain Security** (General)
    - **Action:** Implement dependency scanning and SBOM generation
    - **Timeline:** 8 weeks
    - **Owner:** Security Team
    - **Effort:** Medium

12. **Security Testing** (General)
    - **Action:** Add SAST, DAST, and dependency scanning to CI/CD
    - **Timeline:** 8 weeks
    - **Owner:** Security Team
    - **Effort:** High

---

## Threat Model Review Cadence

### Regular Review Schedule

- **Quarterly Reviews:** Every 3 months or before major releases
- **Review Triggers:**
  - New features or functionality
  - Significant architecture changes
  - Security incidents or vulnerabilities
  - Dependency updates (major versions)
  - New integration points
  - Compliance requirement changes

### Review Process

1. **Preparation (1 week before)**
   - Review recent security incidents
   - Collect feedback from development and operations teams
   - Review recent CVEs affecting dependencies
   - Gather threat intelligence relevant to the stack

2. **Review Meeting (2 hours)**
   - Walk through architecture changes
   - Assess new threats
   - Review mitigation progress
   - Update threat likelihood/impact ratings
   - Prioritize new recommendations

3. **Follow-up (1 week after)**
   - Update threat model document
   - Create or update security tickets
   - Communicate changes to stakeholders
   - Update security documentation

### Review Participants

- Security Team Lead
- Development Team Lead
- SRE/Operations Representative
- Product Owner
- Optional: External security consultant (annual)

---

## Related Documentation

### Security Policies
- [Organization Security Policy](https://internal-docs/security/policy)
- [Incident Response Plan](https://internal-docs/security/incident-response)
- [Access Control Policy](https://internal-docs/security/access-control)
- [Data Classification Policy](https://internal-docs/security/data-classification)

### Technical Documentation
- [Backstage Security Documentation](https://backstage.io/docs/security/)
- [OpsLevel API Documentation](https://docs.opslevel.com/docs/api)
- [Plugin Installation Guide](README.md)
- [Contributing Guidelines](CONTRIBUTING.md)

### Runbooks
- [Security Incident Response Runbook](https://internal-docs/runbooks/security-incident)
- [API Token Rotation Procedure](https://internal-docs/runbooks/token-rotation)
- [Database Backup and Recovery](https://internal-docs/runbooks/database-recovery)
- [Emergency Plugin Shutdown](https://internal-docs/runbooks/emergency-shutdown)

### Compliance
- [SOC 2 Compliance Documentation](https://internal-docs/compliance/soc2)
- [GDPR Data Processing Agreement](https://internal-docs/compliance/gdpr)
- [Security Audit Reports](https://internal-docs/compliance/audits)

---

## Appendix

### Threat Severity Matrix

| Impact / Likelihood | Very Low | Low | Medium | High | Critical |
|---------------------|----------|-----|--------|------|----------|
| **Critical**        | Medium   | High | High   | Critical | Critical |
| **High**            | Low      | Medium | High | High   | Critical |
| **Medium**          | Low      | Low  | Medium | Medium | High     |
| **Low**             | Very Low | Low  | Low    | Medium | Medium   |
| **Very Low**        | Very Low | Very Low | Low | Low    | Medium   |

### Glossary

- **STRIDE:** Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege
- **RBAC:** Role-Based Access Control
- **PII:** Personally Identifiable Information
- **SIEM:** Security Information and Event Management
- **SAST:** Static Application Security Testing
- **DAST:** Dynamic Application Security Testing
- **SBOM:** Software Bill of Materials
- **CVE:** Common Vulnerabilities and Exposures

### Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-01-19 | Security Team | Initial threat model creation |

---

**Document Classification:** Internal
**Next Review Date:** 2024-04-19
