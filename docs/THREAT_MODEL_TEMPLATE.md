# Threat Model Template

**Version:** [Version Number]
**Last Updated:** [Date]
**Owner:** [Team/Individual]
**Status:** [Draft/Active/Archived]

---

## Executive Summary

[Provide a high-level overview of the system being threat modeled, its purpose, and key security concerns. This should be 2-3 paragraphs that executives and non-technical stakeholders can understand.]

---

## System Architecture Overview

### Components

[List and describe the major components of your system]

1. **[Component Name]** (`filename.ext`)
   - [Brief description]
   - [Key responsibilities]
   - [Technologies used]

2. **[Component Name]** (`filename.ext`)
   - [Brief description]
   - [Key responsibilities]
   - [Technologies used]

### Data Flows

[Describe how data moves through your system. Use diagrams where possible]

```
[ASCII diagram or reference to architecture diagram]
```

**Example Flow:**
```
User ──> API Gateway ──> Service Layer ──> Database
                    │
                    └──> External Service
```

### Trust Boundaries

[Identify where trust boundaries exist in your system]

1. **[Boundary Name]**
   - Description: [What separates trusted from untrusted]
   - Controls: [What protects this boundary]

2. **[Boundary Name]**
   - Description: [What separates trusted from untrusted]
   - Controls: [What protects this boundary]

---

## Assets and Data Classification

### Critical Assets

[List the most important assets that need protection]

1. **[Asset Name]** (CRITICAL/HIGH/MEDIUM/LOW)
   - Storage: [Where is it stored]
   - Usage: [How is it used]
   - Impact if compromised: [What happens if this is compromised]

### Data Classification

| Data Type | Classification | Storage Location | Encryption Required |
|-----------|---------------|------------------|---------------------|
| [Data Type] | SECRET/CONFIDENTIAL/INTERNAL/PUBLIC | [Location] | Yes/No |

---

## Threat Analysis (STRIDE)

### Spoofing Threats

#### T-SPOOF-001: [Threat Name]
- **Description:** [Detailed description of the threat]
- **Attack Vector:**
  - [How could an attacker exploit this]
  - [What conditions enable this attack]
- **Impact:** [What damage could this cause]
- **Likelihood:** Critical/High/Medium/Low/Very Low
- **Current Controls:**
  - [What currently prevents this]
- **Mitigation Recommendations:**
  - [What additional controls are needed]
  - [Priority and timeline]

### Tampering Threats

#### T-TAMP-001: [Threat Name]
- **Description:** [Detailed description of the threat]
- **Attack Vector:**
  - [How could an attacker exploit this]
- **Impact:** [What damage could this cause]
- **Likelihood:** Critical/High/Medium/Low/Very Low
- **Current Controls:**
  - [What currently prevents this]
- **Mitigation Recommendations:**
  - [What additional controls are needed]

### Repudiation Threats

#### T-REPU-001: [Threat Name]
- **Description:** [Detailed description of the threat]
- **Attack Vector:**
  - [How could an attacker exploit this]
- **Impact:** [What damage could this cause]
- **Likelihood:** Critical/High/Medium/Low/Very Low
- **Current Controls:**
  - [What currently prevents this]
- **Mitigation Recommendations:**
  - [What additional controls are needed]

### Information Disclosure Threats

#### T-INFO-001: [Threat Name]
- **Description:** [Detailed description of the threat]
- **Attack Vector:**
  - [How could an attacker exploit this]
- **Impact:** [What damage could this cause]
- **Likelihood:** Critical/High/Medium/Low/Very Low
- **Current Controls:**
  - [What currently prevents this]
- **Mitigation Recommendations:**
  - [What additional controls are needed]

### Denial of Service Threats

#### T-DOS-001: [Threat Name]
- **Description:** [Detailed description of the threat]
- **Attack Vector:**
  - [How could an attacker exploit this]
- **Impact:** [What damage could this cause]
- **Likelihood:** Critical/High/Medium/Low/Very Low
- **Current Controls:**
  - [What currently prevents this]
- **Mitigation Recommendations:**
  - [What additional controls are needed]

### Elevation of Privilege Threats

#### T-PRIV-001: [Threat Name]
- **Description:** [Detailed description of the threat]
- **Attack Vector:**
  - [How could an attacker exploit this]
- **Impact:** [What damage could this cause]
- **Likelihood:** Critical/High/Medium/Low/Very Low
- **Current Controls:**
  - [What currently prevents this]
- **Mitigation Recommendations:**
  - [What additional controls are needed]

---

## Attack Vectors and Entry Points

### External Attack Surface

[List all externally accessible entry points]

1. **[Entry Point Name]**
   - Description: [What it does]
   - Risk Level: Critical/High/Medium/Low
   - Authentication Required: Yes/No
   - Authorization Required: Yes/No

### Internal Entry Points

[List internal entry points that could be compromised]

1. **[Entry Point Name]**
   - Description: [What it does]
   - Risk Level: Critical/High/Medium/Low

### Dependencies and Third-Party Integrations

[List external dependencies and their risks]

1. **[Dependency Name]** (version X.Y.Z)
   - Purpose: [Why is it used]
   - Trust Level: [High/Medium/Low]
   - Supply Chain Risk: [Assessment]
   - Mitigation: [How risks are addressed]

---

## Existing Security Controls

### Authentication & Authorization
- ✓ [Control that exists]
- ⚠️ [Control that needs verification or improvement]
- ✗ [Missing control]

### Input Validation
- ✓ [Control that exists]
- ⚠️ [Control that needs verification or improvement]

### Data Protection
- ✓ [Control that exists]
- ⚠️ [Control that needs verification or improvement]

### Error Handling
- ✓ [Control that exists]
- ⚠️ [Control that needs verification or improvement]

### Rate Limiting
- ✓ [Control that exists]
- ⚠️ [Control that needs verification or improvement]

### Audit & Logging
- ✓ [Control that exists]
- ⚠️ [Control that needs verification or improvement]

### Database Security
- ✓ [Control that exists]
- ⚠️ [Control that needs verification or improvement]

### Operational Security
- ✓ [Control that exists]
- ⚠️ [Control that needs verification or improvement]

---

## Threat Mitigation Recommendations

### High Priority (Immediate Action Required)

1. **[Recommendation Name]** ([Threat IDs])
   - **Action:** [What needs to be done]
   - **Timeline:** [When it should be completed]
   - **Owner:** [Who is responsible]
   - **Effort:** High/Medium/Low

### Medium Priority (Within 30 Days)

2. **[Recommendation Name]** ([Threat IDs])
   - **Action:** [What needs to be done]
   - **Timeline:** [When it should be completed]
   - **Owner:** [Who is responsible]
   - **Effort:** High/Medium/Low

### Low Priority (Within 90 Days)

3. **[Recommendation Name]** ([Threat IDs])
   - **Action:** [What needs to be done]
   - **Timeline:** [When it should be completed]
   - **Owner:** [Who is responsible]
   - **Effort:** High/Medium/Low

---

## Threat Model Review Cadence

### Regular Review Schedule

- **Frequency:** [Quarterly/Monthly/etc.]
- **Review Triggers:**
  - [Trigger 1: e.g., New features]
  - [Trigger 2: e.g., Security incidents]
  - [Trigger 3: e.g., Architecture changes]

### Review Process

1. **Preparation ([Timeframe])**
   - [Activity 1]
   - [Activity 2]

2. **Review Meeting ([Duration])**
   - [Activity 1]
   - [Activity 2]

3. **Follow-up ([Timeframe])**
   - [Activity 1]
   - [Activity 2]

### Review Participants

- [Role 1]
- [Role 2]
- [Role 3]

---

## Related Documentation

### Security Policies
- [Link to Policy 1]
- [Link to Policy 2]

### Technical Documentation
- [Link to Architecture Docs]
- [Link to API Documentation]

### Runbooks
- [Link to Incident Response]
- [Link to Recovery Procedures]

### Compliance
- [Link to Compliance Documentation]
- [Link to Audit Reports]

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
- **[Term]:** [Definition]

### Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | [Date] | [Author] | Initial creation |

---

## Instructions for Using This Template

1. **Start with Architecture**: Fill out the system architecture section first to understand what you're protecting
2. **Identify Assets**: List all critical assets and classify data before identifying threats
3. **Apply STRIDE**: Go through each STRIDE category systematically
4. **Be Specific**: Use concrete examples and specific threat IDs
5. **Prioritize**: Not all threats are equal - focus on high-impact, high-likelihood threats first
6. **Track Mitigations**: Ensure each recommendation has an owner and timeline
7. **Keep Updated**: Threat models are living documents - review and update regularly
8. **Get Feedback**: Involve multiple stakeholders in threat modeling sessions

### STRIDE Quick Reference

- **Spoofing:** Identity - Can someone pretend to be someone/something else?
- **Tampering:** Data integrity - Can someone modify data or code?
- **Repudiation:** Non-repudiation - Can someone deny doing something?
- **Information Disclosure:** Confidentiality - Can someone see information they shouldn't?
- **Denial of Service:** Availability - Can someone prevent legitimate users from accessing the system?
- **Elevation of Privilege:** Authorization - Can someone gain capabilities they shouldn't have?

### Tips for Effective Threat Modeling

- **Think Like an Attacker:** Consider what would you do to compromise this system
- **Use Real Examples:** Reference actual CVEs, incidents, or attack patterns
- **Don't Just Focus on Code:** Consider configuration, deployment, operations, and people
- **Consider the Supply Chain:** Third-party dependencies can introduce risks
- **Balance Paranoia with Pragmatism:** Not every theoretical threat needs immediate mitigation
- **Document Assumptions:** State what you're assuming is already secure
- **Involve the Team:** Diverse perspectives identify more threats

---

**Document Classification:** [Classification Level]
**Next Review Date:** [Date]
