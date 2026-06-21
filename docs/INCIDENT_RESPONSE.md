# Incident Response Procedures

**Version:** 1.0  
**Date:** June 2026  
**Status:** Production

## Quick Reference - Incident Severity Levels

| Level | Impact | Response Time | Examples |
|-------|--------|---|---|
| **P0 - Critical** | System outage, data breach | 15 minutes | Ransomware, major data exfil |
| **P1 - High** | Service degradation, vulnerability | 1 hour | Active exploit, DDoS |
| **P2 - Medium** | Limited impact, contains easily | 4 hours | Intrusion attempt blocked |
| **P3 - Low** | Minimal impact, no urgency | Next business day | Policy violation |

## Contact Information

**Incident Commander (On-Call):**
- Primary: [CISO Name] - [Phone]
- Secondary: [CTO Name] - [Phone]

**24/7 Escalation:** [Phone/SMS] → [Email] → [Slack Channel]

**External Contacts:**
- Legal: [General Counsel] - [Phone]
- PR: [Communications Director] - [Phone]
- Forensics: [Forensics Company] - [Phone]
- Law Enforcement: 911 for emergency, FBI Cyber if applicable

## Phase 1: Detection and Alerting

### Monitoring Systems

**Automated Detection:**
- SIEM alerting rules
- Intrusion detection system (IDS)
- Application monitoring
- Network monitoring
- Endpoint detection and response (EDR)

**Alert Escalation:**
```
Alert triggered
    ↓
Severity assessment (P0-P3)
    ↓
Automated escalation to on-call
    ↓
Slack/SMS notification
    ↓
Incident declared
```

### Initial Triage (5-10 minutes)

**Questions to Answer:**
1. What system/service is affected?
2. How many users/customers impacted?
3. Is customer data potentially exposed?
4. Is the service currently down or degraded?
5. What is the apparent cause?

**Actions:**
- [ ] Acknowledge alert
- [ ] Create incident ticket with timestamp
- [ ] Assign initial severity (P0-P3)
- [ ] Activate incident commander
- [ ] Begin war room (Slack channel, video call)
- [ ] Preserve evidence (do not restart systems)

## Phase 2: Analysis and Containment

### Incident Commander Responsibilities

**Immediately:**
- [ ] Take command and establish communication protocol
- [ ] Confirm severity level
- [ ] Activate incident response team
- [ ] Establish war room (Slack + video call)
- [ ] Create incident timeline and evidence log

**Within 30 minutes:**
- [ ] Brief executive stakeholders
- [ ] Determine if breach/containment needed
- [ ] Activate forensics team if needed
- [ ] Begin communication plan

### Investigation Steps

**1. System Preservation** (Do not disturb evidence)
```bash
# Collect volatile data FIRST
date >> /tmp/incident_log.txt
hostname >> /tmp/incident_log.txt
ps aux >> /tmp/incident_log.txt
netstat -anp >> /tmp/incident_log.txt
history >> /tmp/incident_log.txt

# Create memory dump (if available)
sudo dd if=/dev/mem of=/tmp/memory.dump

# Preserve logs
tar czf /tmp/logs_$(date +%s).tar.gz /var/log/

# Hash critical files
find /etc /usr/local/bin -type f -exec sha256sum {} \; > /tmp/baseline.sha256
```

**2. Scope and Impact Assessment**
```
Determine:
- Which systems compromised?
- Which data accessed?
- How long was access possible?
- How many records affected?
- Are customer notifications needed?
```

**3. Root Cause Analysis**
```
Investigate:
- Attack vector (phishing, exploit, weak password, etc.)
- Entry point (which system was compromised first)
- Lateral movement (how did attacker move in network)
- Persistence mechanisms (backdoors installed)
- Data exfiltration evidence
```

### Containment Actions

**Short-term Containment** (Immediate):
- [ ] Isolate affected systems from network
- [ ] Revoke compromised credentials
- [ ] Block IP addresses of attacker
- [ ] Enable enhanced monitoring
- [ ] Block external communications from infected systems

**Long-term Containment** (1-24 hours):
- [ ] Patch vulnerability
- [ ] Update firewall rules
- [ ] Implement compensating controls
- [ ] Re-baseline compromised systems
- [ ] Increase monitoring thresholds

## Phase 3: Eradication and Recovery

### System Remediation

**For Compromised Systems:**
1. Disconnect from network
2. Image disk (for forensics)
3. Perform malware scan
4. Patch operating system
5. Patch all applications
6. Restore from known-good backup
7. Verify integrity
8. Reconnect to network
9. Monitor closely

**For Credentials:**
1. Reset all passwords for affected users
2. Revoke all API tokens
3. Invalidate all session tokens
4. Enforce MFA re-registration
5. Monitor for credential reuse

### Service Recovery

**For Down Services:**
1. Identify degraded/down services
2. Assess damage and data consistency
3. Restore from last-known-good backup
4. Validate data integrity
5. Bring systems online in correct order
6. Run smoke tests
7. Gradually return to normal traffic
8. Monitor for issues

**Recovery Priority:**
1. Critical customer-facing systems
2. Database systems
3. Supporting infrastructure
4. Administrative systems
5. Non-critical systems

## Phase 4: Notification and Communication

### Data Breach Notification

**GDPR Requirements:**
- Notify supervisory authority within **72 hours** (even if uncertain)
- Notify data subjects without undue delay if high risk
- Maintain documentation of breach assessment

**Breach Notification Template:**
```
Subject: Security Incident Notification

Dear Customer,

On [DATE] at approximately [TIME], we identified a security incident 
affecting our systems. Upon investigation, we determined that [DESCRIBE 
INCIDENT].

Data involved: [List specific data types]
Number of records: [Number]
Estimated risk: [Low/Medium/High/Critical]

Measures taken:
1. [Containment actions]
2. [Investigation results]
3. [System hardening]

What you should do:
- Monitor accounts for unauthorized activity
- Change passwords for related services
- Enable two-factor authentication

Additional information:
- Dedicated website: [URL]
- Support hotline: [Phone]
- Email: [Email]

We take your privacy seriously and sincerely apologize for this incident.

Sincerely,
BlockStop Security Team
```

### Stakeholder Communication

**Customers:**
- Proactive notification if data exposed
- Provide credit monitoring if financial data
- Regular status updates
- Dedicated support channel

**Employees:**
- Transparent information
- Security recommendations
- Frequently asked questions
- Regular updates

**Regulators/Law Enforcement:**
- Timely breach notifications
- Incident report documentation
- Preservation of evidence for authorities

### Media/Public Communication

**Key Messages:**
- Acknowledge incident professionally
- Explain response actions taken
- Emphasize customer protection
- Commit to transparency
- Avoid speculation

**Example Statement:**
```
"BlockStop takes the security of our systems and our customers' 
data very seriously. On [DATE], we detected and contained a security 
incident affecting [SCOPE]. We have engaged forensics experts and 
notified relevant authorities. A full investigation is underway. 
We are implementing additional security measures and will update 
customers as we learn more."
```

## Phase 5: Post-Incident Activities

### Forensic Analysis (Days 1-7)

**Conducted by forensics team:**
- [ ] Complete timeline of events
- [ ] Attribution (if possible)
- [ ] Evidence documentation
- [ ] Chain of custody
- [ ] Detailed forensics report

**Forensics Report Sections:**
1. Executive Summary
2. Incident Timeline
3. Attack Vector and Methodology
4. Systems Affected
5. Data Accessed
6. Root Cause Analysis
7. Recommendations
8. Technical Appendix

### Post-Incident Review (Within 1 week)

**Meeting Participants:**
- Incident Commander
- Technical team leads
- Security team
- Operations
- Executive sponsor

**Discussion Topics:**
1. What went well?
2. What could be improved?
3. Were procedures followed?
4. Were tools adequate?
5. Were communications effective?

**Outcomes:**
- [ ] Documented lessons learned
- [ ] Root cause analysis completed
- [ ] Prevention recommendations
- [ ] Process improvements identified
- [ ] Training needs identified

### Corrective Actions (Weeks 1-12)

**Example Actions:**
- [ ] Implement compensating controls
- [ ] Patch systems/applications
- [ ] Update detection rules
- [ ] Improve monitoring
- [ ] Strengthen access controls
- [ ] Security awareness training
- [ ] Policy updates
- [ ] Vendor assessments
- [ ] Architecture changes

**Tracking:**
- Assign owners to each action
- Set completion deadlines
- Track progress in ticketing system
- Report to executive steering committee

### Metrics to Track

```
For each incident:
- Time to detect: ___ minutes
- Time to contain: ___ hours
- Time to eradicate: ___ hours
- Time to recover: ___ hours
- Customer impact: ___ [description]
- Data exposed: ___ records
- Cost of incident: $___ [if quantifiable]
```

## Procedures by Incident Type

### Data Breach / Exfiltration

```
Immediate Actions:
1. Isolate affected systems
2. Revoke credentials used
3. Check firewall/proxy logs for data movement
4. Determine data exposed and affected users
5. Notify legal (litigation hold)
6. Engage forensics firm

Investigation:
1. How was data accessed?
2. When was it accessed?
3. Where was it exfiltrated to?
4. Is there evidence it was used?
5. Are there multiple exfiltration points?

Notification:
1. If personally identifiable information exposed: GDPR notification required
2. If financial data: PCI DSS notification required
3. If health data: HIPAA notification required
4. Document all breach notifications
```

### Ransomware Attack

```
DO NOT PAY RANSOM (in most jurisdictions)

Immediate Actions:
1. ISOLATE ALL INFECTED SYSTEMS (power off if needed)
2. Assess which systems encrypted
3. Preserve evidence
4. Check backups are clean
5. Notify law enforcement (FBI if in US)
6. Engage ransomware incident response firm

Investigation:
1. When was encryption detected?
2. Where was ransomware introduced from?
3. How did it spread?
4. What data was accessed before encryption?
5. What was the attacker's command and control?

Recovery:
1. Restore from known-good backups
2. Patch vulnerability that allowed entry
3. Harden network segmentation
4. Improve backup isolation
5. Implement immutable backups
```

### Distributed Denial of Service (DDoS)

```
Immediate Actions:
1. Declare incident
2. Increase traffic analysis and monitoring
3. Alert ISP/CDN provider (CloudFlare, etc.)
4. Enable DDoS protection features
5. Prepare public communication

Mitigation:
1. Rate limiting rules
2. WAF rules to block malicious traffic
3. IP reputation blocking
4. Geographic blocking (if applicable)
5. Traffic scrubbing service activation

Recovery:
1. Monitor traffic patterns
2. Gradually scale down protection
3. Analyze attack characteristics
4. Implement permanent mitigations
5. Update DDoS plan
```

### Insider Threat

```
Immediate Actions:
1. Preserve evidence (logs, emails, files)
2. Notify legal and HR
3. Revoke access carefully (coordinate with HR)
4. Do not alert employee until coordinated
5. Engage law enforcement if criminal
6. Notify auditors/regulators if required

Investigation:
1. What access did employee have?
2. What data accessed/removed?
3. When did unauthorized activity occur?
4. Are other employees involved?
5. Was activity for personal gain or sabotage?

Actions:
1. Coordinate with HR for employment action
2. Pursue legal action if warranted
3. Increase monitoring of similar roles
4. Review access controls
5. Update hiring/termination procedures
```

## Incident Response Checklist

### During Incident

- [ ] Alert incident commander
- [ ] Create incident ticket
- [ ] Establish war room
- [ ] Declare severity level
- [ ] Preserve evidence
- [ ] Collect system information
- [ ] Determine scope
- [ ] Contain threat
- [ ] Notify stakeholders
- [ ] Maintain timeline
- [ ] Document all actions

### After Containment

- [ ] Complete eradication
- [ ] Restore systems
- [ ] Verify functionality
- [ ] Send notifications
- [ ] Brief executives
- [ ] Engage forensics (if needed)
- [ ] Preserve evidence
- [ ] Document lessons learned

### Post-Incident (Week 1-2)

- [ ] Complete forensics report
- [ ] Conduct post-incident review
- [ ] Identify root causes
- [ ] Develop action plan
- [ ] Assign ownership
- [ ] Set deadlines
- [ ] Begin implementation
- [ ] Report to board

### Follow-up (Ongoing)

- [ ] Track remediation progress
- [ ] Update policies
- [ ] Conduct training
- [ ] Review detection rules
- [ ] Verify mitigations work
- [ ] Close incident
- [ ] Archive documentation

## Templates and Tools

### Incident Ticket Template

```yaml
Incident ID: [Auto-generated]
Created: [Timestamp]
Status: [Open/In Progress/Resolved]
Severity: [P0-P3]

Title: [Brief description]
Description: [Detailed description]

Affected Systems: [List]
Affected Data: [List]
Affected Users: [Number/List]

Discovery Method: [Alert/Manual/Report]
Detection Time: [Timestamp]
Containment Time: [Timestamp]
Resolution Time: [Timestamp]

Incident Commander: [Name]
Technical Lead: [Name]
Communications Lead: [Name]

Status Updates:
- [Timestamp] [Update]
- [Timestamp] [Update]

Root Cause: [To be determined]
Impact Assessment: [To be determined]
Lessons Learned: [To be determined]
```

### War Room Setup

**Slack Channel:** #incident-[incident-id]
**Video Call:** [Video conference link]
**Document:** [Shared incident timeline]
**Escalation:** See Contact Information section

### War Room Cadence

- **P0:** Every 15 minutes
- **P1:** Every 30 minutes  
- **P2:** Every 2 hours
- **P3:** Daily or as needed

## Training and Drills

### Annual Incident Response Exercise

**Frequency:** Twice annually (spring and fall)

**Scope:** Full incident response simulation

**Objectives:**
- Test procedures
- Validate tools
- Train team members
- Identify gaps
- Practice communication

**After-Action Items:**
- Document what worked
- Document what didn't
- Update procedures
- Schedule follow-up training

---

**Approval:**

- Chief Information Security Officer: _________________
- Chief Technology Officer: _________________
- Chief Executive Officer: _________________

**Last Updated:** June 2026  
**Next Review:** December 2026
