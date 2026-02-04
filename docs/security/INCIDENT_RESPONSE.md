# Incident Response Playbook 🚨

**Purpose**: Guide the team through security incidents and outages effectively.
**Scope**: All production systems (AI Code Mentor).

## 1. Severity Levels

| Level | Description | Example | Response Time |
|-------|-------------|---------|---------------|
| **SEV-1 (Critical)** | Data Breach, Full Outage, Financial Limit Hit | `export-portfolio` leaking data, Site Down | **Immediate (15m)** |
| **SEV-2 (High)** | Major degradation, core feature broken | AI generation failing, Login broken | **1 Hour** |
| **SEV-3 (Medium)** | Minor bug, non-critical feature | CSS issue, slow report gen | **24 Hours** |

## 2. Response Workflow

### Phase 1: Detection & Triage
1.  **Acknowledge**: "I am investigating [Alert ID]."
2.  **Verify**: Confirm it's real (check logs, try to reproduce).
3.  **Classify**: Assign SEV level.

### Phase 2: Containment (Stop the Bleeding)
*   **Leak**: Rotate exposed keys immediately (`GEMINI_API_KEY`, `JWT_SECRET`).
*   **Attack**: Block IP in Vercel Firewall / Cloudflare.
*   **Bad Deploy**: Run `vercel rollback` to previous known good state.
*   **Feature Exploit**: Disable feature via Env Var (`NEXT_PUBLIC_DISABLE_EXPORT=true`).

### Phase 3: Eradication & Recovery
1.  **Patch**: Fix the vulnerability (hotfix branch).
2.  **Verify**: Test fix in Staging.
3.  **Deploy**: Push to Prod.
4.  **Monitor**: Watch logs for 1 hour.

### Phase 4: Post-Mortem
*   Conduct "Blameless Post-Mortem" within 48h.
*   **Questions**:
    *   What happened?
    *   Why didn't we catch it sooner?
    *   What automation could prevent this?

## 3. Key Contacts
*   **Security Lead**: [Insert Name]
*   **Infrastructure**: Vercel Support
*   **AI Provider**: Google Cloud Console

## 4. Emergency Commands
```bash
# Force Rotate JWT (Users will be logged out)
# (Deployment required to change env var)

# Check Logs
vercel logs ai-code-mentor

# Rollback
vercel rollback
```
