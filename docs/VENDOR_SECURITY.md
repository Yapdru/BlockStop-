# Vendor Security Requirements

**Version:** 1.0  
**Date:** June 2026  
**Status:** Production

## Overview

This document establishes security requirements for all vendors, service providers, and partners who process, store, or access BlockStop data or infrastructure.

## Table of Contents

1. [Vendor Classification](#vendor-classification)
2. [Initial Assessment](#initial-assessment)
3. [Security Requirements by Category](#security-requirements-by-category)
4. [Data Processing Agreements](#data-processing-agreements)
5. [Ongoing Monitoring](#ongoing-monitoring)
6. [Audit Rights](#audit-rights)
7. [Incident and Breach Management](#incident-and-breach-management)
8. [Offboarding](#offboarding)

## Vendor Classification

### Tier 1: Critical Infrastructure

**Definition:** Vendors managing critical infrastructure, processing personal data at scale, or providing security-related services

**Examples:**
- Cloud infrastructure providers (AWS, Azure, GCP)
- Database services (Heroku, managed databases)
- Security tools (SIEM, IDS, firewall)
- Email providers
- Payment processors

**Security Level Required:** HIGHEST

### Tier 2: Important Services

**Definition:** Vendors providing important services with limited data access

**Examples:**
- Analytics platforms (Mixpanel, Amplitude)
- Monitoring tools (Datadog, New Relic)
- Development tools (GitHub, GitLab)
- Communication tools (Slack, Zoom)
- HR systems

**Security Level Required:** HIGH

### Tier 3: Standard Services

**Definition:** Vendors providing standard services with minimal data exposure

**Examples:**
- Office supplies
- Facilities management
- IT hardware suppliers
- Consulting services (non-security)
- Legal services

**Security Level Required:** STANDARD

## Initial Assessment

### Pre-Engagement Questionnaire

All vendors (Tier 1, 2, 3) must complete security questionnaire:

#### Tier 1 - Comprehensive Assessment

**1. Company Information**
- [ ] Legal business name and address
- [ ] Years in business
- [ ] Financial stability (audited statements)
- [ ] Insurance coverage (liability, cyber, E&O)

**2. Security Program**
- [ ] Written information security policy
- [ ] Designated security officer/CISO
- [ ] Security training program
- [ ] Incident response plan
- [ ] Business continuity plan

**3. Access Control**
- [ ] Authentication mechanism (MFA preferred)
- [ ] Access provisioning/deprovisioning process
- [ ] Access review frequency
- [ ] Privileged account management
- [ ] Termination procedures

**4. Data Protection**
- [ ] Encryption for data in transit (TLS 1.2+)
- [ ] Encryption for data at rest (AES-256 or equivalent)
- [ ] Data classification scheme
- [ ] Data retention policies
- [ ] Data destruction procedures
- [ ] Backup and recovery procedures
- [ ] Data residency (if applicable)

**5. Monitoring and Logging**
- [ ] Centralized logging
- [ ] Log retention period
- [ ] Monitoring tools deployed
- [ ] Alerting thresholds
- [ ] Log access controls
- [ ] Audit logging enabled

**6. Vulnerability Management**
- [ ] Vulnerability scanning frequency
- [ ] Penetration testing (annual minimum)
- [ ] Patch management process
- [ ] SLA for critical patches
- [ ] Known CVE tracking

**7. Compliance**
- [ ] SOC 2 Type II certification (preferred)
- [ ] ISO 27001 certification (preferred)
- [ ] GDPR compliance
- [ ] Industry-specific compliance (HIPAA, PCI DSS, etc.)
- [ ] Regular audit frequency

**8. Third-Party Management**
- [ ] Sub-processor approval process
- [ ] Sub-processor security requirements
- [ ] Contract clauses requiring DPA
- [ ] Audit rights for sub-processors
- [ ] Notice period for sub-processor changes

**9. Incident Response**
- [ ] Documented incident response plan
- [ ] 24/7 security contact
- [ ] Breach notification timeframe
- [ ] Evidence preservation procedures
- [ ] Post-incident review process

**10. Business Continuity**
- [ ] Disaster recovery plan
- [ ] Recovery Time Objective (RTO)
- [ ] Recovery Point Objective (RPO)
- [ ] Redundancy/failover mechanisms
- [ ] Testing frequency

#### Tier 2 - Standard Assessment

**Core Requirements (subset of Tier 1):**
- [ ] Company information
- [ ] Written security policy
- [ ] Access control procedures
- [ ] Data encryption (transit and rest)
- [ ] Vulnerability management
- [ ] Incident response contact
- [ ] Compliance certifications
- [ ] Business continuity plan

#### Tier 3 - Basic Assessment

**Minimum Requirements:**
- [ ] Company information and legitimacy
- [ ] Basic security awareness
- [ ] Data handling procedures
- [ ] Contact for security issues

### Reference Checks

**For all vendors:**
1. Check references with other clients
2. Verify past security incidents
3. Confirm business stability
4. Validate certifications (SOC 2, ISO 27001)
5. Search for public breach information

### Certifications and Documentation

**Tier 1 Vendors Must Provide:**
- [ ] SOC 2 Type II Report (or audit report)
- [ ] ISO 27001 Certificate (or equivalent)
- [ ] Security policy overview
- [ ] DPA terms
- [ ] Insurance certificates

**Tier 2 Vendors Should Provide:**
- [ ] SOC 2 Report (or similar)
- [ ] Security overview document
- [ ] DPA terms
- [ ] Insurance information

## Security Requirements by Category

### Data in Transit

**Requirement:** All data transmission must use encryption

**Standards:**
- TLS 1.2 minimum (TLS 1.3 preferred)
- Valid certificates from trusted CA
- Perfect Forward Secrecy (PFS) enabled
- No mixed content (HTTP/HTTPS)

**Verification:**
```bash
# Test TLS version
echo | openssl s_client -connect vendor.com:443 -tls1_2

# Test certificate
echo | openssl s_client -connect vendor.com:443 | openssl x509 -noout -text
```

### Data at Rest

**Requirement:** Sensitive data must be encrypted

**Standards:**
- AES-256-GCM or equivalent
- Keys managed securely (HSM/KMS)
- Encryption keys not accessible to vendor support staff
- Regular key rotation

**Encryption Scope:**
- Customer PII: Mandatory
- Financial data: Mandatory
- Health data: Mandatory
- Logs containing sensitive data: Mandatory
- Non-sensitive data: Recommended

### Access Control

**Requirements:**
- Authentication required for all access
- Multi-factor authentication for privileged access
- No shared accounts
- Minimal necessary access granted
- Access reviewed quarterly
- Immediate revocation upon termination
- No backdoor/master accounts
- Activity logging for all access

### Audit Logging

**Requirements:**
- All access events logged with timestamp, user, action
- Authentication successes and failures logged
- Administrative actions logged
- Data access events logged (especially sensitive data)
- Log retention minimum 90 days (1 year for sensitive operations)
- Logs protected from tampering
- Regular log review for anomalies
- Incident alerting for suspicious activity

### Vulnerability Management

**Requirements:**
- Vulnerability scanning: Minimum monthly
- Penetration testing: Minimum annually
- Known vulnerability patching: Within 30 days for high/critical
- Vulnerability disclosure program recommended
- Security advisories tracked and evaluated
- Critical patches applied within 24 hours

### Incident Response

**Requirements:**
- Documented incident response plan
- 24/7 security contact information
- Breach notification within 24 hours (template provided)
- Notification template compliance
- Evidence preservation
- Root cause analysis provided
- Remediation plan provided
- Post-incident cooperation with investigations

### Business Continuity

**Tier 1 Requirements:**
- RTO: 4 hours maximum for critical services
- RPO: 1 hour for critical data
- Redundancy across geographic regions
- Automated failover capability
- Disaster recovery testing: Quarterly minimum
- Backup verification: Weekly minimum

**Tier 2 Requirements:**
- RTO: 24 hours
- RPO: 4 hours
- Backup and recovery capability
- Annual testing

## Data Processing Agreements

### DPA Requirements

All Tier 1 vendors processing personal data must sign Data Processing Agreement including:

**1. Data Protection Obligations**
```
Processor shall:
- Process personal data only on documented instructions from Controller
- Ensure persons authorized to process data are under confidentiality obligation
- Implement appropriate technical and organizational security measures
- Ensure sub-processors comply with same data protection obligations
- Provide assistance for data subject rights requests
- Delete or return personal data upon Controller request
```

**2. Security and Confidentiality**
```
Processor shall implement:
- Encryption for data in transit and at rest
- Access controls and authentication
- Ability to ensure availability and resilience
- Testing and evaluation of security measures
- Incident response procedures
- Personnel training on data protection
```

**3. Sub-processing**
```
- No sub-processors without prior written authorization
- Controller may object to sub-processors
- Processor liable for sub-processor performance
- DPA requirements flow down to sub-processors
```

**4. Data Subject Rights**
```
Processor shall assist Controller in responding to:
- Right to access (Art. 15)
- Right to rectification (Art. 16)
- Right to erasure (Art. 17)
- Right to restrict processing (Art. 18)
- Right to data portability (Art. 20)
- Right to object (Art. 21)
```

**5. Audit Rights**
```
Controller has right to:
- Audit Processor's compliance
- Conduct security assessments
- Review security documentation
- Inspect facilities (with reasonable notice)
- Engage third-party auditors
```

**6. International Transfers**
```
If data transferred outside EU/EEA:
- Standard Contractual Clauses (SCCs) included
- Transfer Impact Assessment completed
- Supplementary measures documented
- Processor liable for legal compliance
```

**7. Term and Termination**
```
- DPA remains in effect for duration of processing
- Upon termination: data deleted or returned
- Certification of deletion provided
- Confidentiality obligations survive
```

### DPA Template Negotiation

**Standard Clauses (Non-Negotiable):**
- Data security requirements
- Audit rights
- Breach notification (24 hours)
- Sub-processor restrictions
- Data subject rights assistance

**Negotiable Clauses:**
- Data retention period
- Geographic location
- Specific security tools
- Audit frequency
- Insurance requirements

**Vendor-Provided Terms:**
- May be accepted if baseline requirements met
- CloudFlare, AWS standard agreements acceptable
- Review by legal team required
- Amendments may be necessary

## Ongoing Monitoring

### Annual Assessment

**Frequency:** At least annually for Tier 1, every 18-24 months for Tier 2

**Assessment Includes:**
- Updated security questionnaire
- Request for SOC 2/ISO 27001 updates
- Verification of certifications
- Security incident history review
- Compliance update
- Reference check (every 2 years)

### Continuous Monitoring

**Real-time Monitoring:**
- Security news alerts (vendor name)
- Breach notification monitoring
- CVE tracking for vendor products
- Public security incidents
- Financial stability monitoring (for critical vendors)

**Quarterly Reviews:**
- Incident reports from vendor
- Security updates/patches applied
- New vulnerabilities discovered
- Access reviews (if privileged access)
- Performance against SLAs

### Audit Program

**Risk-Based Audits:**
- **Tier 1 High-Risk:** Annual on-site audit
- **Tier 1 Standard:** Annual remote audit + SOC 2 review
- **Tier 2:** SOC 2 review + questionnaire update
- **Tier 3:** Questionnaire update as needed

**Audit Scope:**
- Facilities (if on-site)
- System security controls
- Access control implementation
- Encryption implementation
- Logging and monitoring
- Incident response procedures
- Business continuity readiness

## Audit Rights

### Contractual Requirements

All vendor contracts must include:

```
"Audit Rights:

1. On-site Access: Vendor shall provide access to facilities,
   systems, and personnel for audits with 10 business days notice.

2. Remote Audit: Vendor shall provide remote access to systems
   for security audits and assessments.

3. Documentation: Vendor shall provide security documentation,
   audit reports, certifications upon request.

4. Third-Party Auditors: Auditor may engage third-party
   assessors (auditors, penetration testers) with prior notice.

5. Audit Costs: Auditor bears audit costs, except for
   remediation of identified issues (vendor cost).

6. Frequency: Annual audit minimum for Tier 1 vendors,
   as-needed for others.

7. Evidence: Vendor shall cooperate in providing evidence
   of security control implementation.

8. Post-Audit: Vendor shall remediate findings within
   agreed timelines."
```

### Audit Documentation

**Vendors Must Provide:**
- Most recent SOC 2 Type II report (Tier 1)
- Previous penetration test report (last 12 months, Tier 1)
- Incident reports (last 2 years)
- Security certifications
- Insurance certificates
- Compliance audit results
- DPA compliance confirmation

## Incident and Breach Management

### Breach Notification

**Vendor Obligation:**
- Notify BlockStop within **24 hours** of discovering breach
- Provide detailed breach description
- Identify affected data and individuals
- Assess impact on BlockStop data
- Provide timeline of events
- Identify root cause
- Describe remediation actions
- Provide contact for follow-up

**Notification Template:**

```
SECURITY BREACH NOTIFICATION

Vendor: [Company Name]
Date Discovered: [Date/Time]
Date Notified: [Date/Time]
Breach Type: [Type]
Affected Systems: [Systems]
Data Affected: [Data Types]
Individuals Affected: [Estimated Count]
BlockStop Data Exposed: [Yes/No - if yes, describe]

Incident Description:
[Detailed description]

Timeline:
[Chronological timeline of events]

Root Cause:
[Initial assessment of root cause]

Immediate Actions Taken:
1. [Action]
2. [Action]
3. [Action]

Contact Information:
[24/7 contact name and phone]

Forensics:
[Whether forensics firm engaged]
```

### Investigation Support

**Vendor Responsibilities:**
- Preserve all evidence
- Provide forensic image if requested
- Cooperate with external forensics firm
- Provide detailed logs
- Assist with evidence chain of custody
- Provide timeline of user access
- Identify any data exfiltration
- Support regulatory notifications

### Remediation

**Vendor Must Provide:**
- Root cause analysis (within 7 days)
- Remediation plan (within 14 days)
- Implemented mitigations (within timeline agreed)
- Evidence of fixes applied
- Verification testing results
- Assurance no recurrence

## Offboarding

### Vendor Exit Process

**Upon Termination Notice:**
1. Establish data transition timeline
2. Plan data extraction/export
3. Plan system migration
4. Define cutover date
5. Establish vendor support during transition

**During Transition:**
- [ ] All data extracted and verified
- [ ] Data format validated
- [ ] Accounts transitioned
- [ ] Access migrated to new vendor
- [ ] Data deletion scheduled
- [ ] Vendor cooperation confirmed
- [ ] Backup vendor identified

**Upon Completion:**
- [ ] Data deletion certification provided
- [ ] Access revoked
- [ ] Systems decomissioned
- [ ] Vendor assessment marked inactive
- [ ] Final invoice processed

### Data Deletion Certification

Vendor must provide written certification:

```
DATA DELETION CERTIFICATION

Organization: [Vendor Name]
Date: [Date]
Data Scope: [Description of data deleted]
Systems: [List of systems/databases]

Certification:

I hereby certify that all personal data and business data provided
by BlockStop has been:

1. Completely deleted from production systems
2. Deleted from all backup systems
3. Purged from all archives
4. Removed from all disaster recovery systems

Evidence of deletion:
- Hash values of deleted files: [If applicable]
- Database purge logs: [If applicable]
- Backup deletion: [If applicable]

No copies retained: Yes/No

Authorized by:
[Name/Title]
[Signature]
[Date]
```

## Vendor Security Requirements Checklist

**For All Vendors:**
- [ ] Security questionnaire completed
- [ ] References checked
- [ ] Business legitimacy verified
- [ ] Insurance certificates provided
- [ ] Security contact established

**For Tier 1/2 Vendors:**
- [ ] DPA signed (if processing data)
- [ ] SOC 2/ISO 27001 verified
- [ ] Security assessment completed
- [ ] Audit rights clause in contract
- [ ] Breach notification terms agreed
- [ ] Business continuity plan reviewed
- [ ] Encryption requirements confirmed
- [ ] Access control procedures verified
- [ ] Incident response plan reviewed
- [ ] Contract reviewed by legal

**For All Active Vendors:**
- [ ] Annual security review conducted
- [ ] Compliance status verified
- [ ] Insurance current
- [ ] No public security incidents
- [ ] Certifications current
- [ ] Audit findings remediated
- [ ] Access reviews completed
- [ ] SLA compliance verified

---

**Approval:**

- Chief Information Security Officer: _________________
- Procurement Director: _________________
- Chief Technology Officer: _________________

**Last Updated:** June 2026  
**Next Review:** December 2026
