# CVSS 3.1 metrics

ConfirmVuln / SetCveRecordField only take the base vector (8 metrics); do not fill in a score by hand, the system scores it per FIRST CVSS 3.1.
Vector: `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H`
Values: AV=N|A|L|P, AC=L|H, PR=N|L|H, UI=N|R, S=U|C, C/I/A=H|L|N.
Score thresholds: 9.0-10.0 critical, 7.0-8.9 high, 4.0-6.9 medium, 0.1-3.9 low.
Do not map severity from the vulnerability type; choose metrics from the **proven** attack prerequisites and impact. The tool rejects a vector whose PR disagrees with the attack surface.

## PR must agree with attack_surface / required_account

This is the **in-application privilege** the attacker needs before exploiting, and it must match what you set on Confirm:

| Attack surface | Account needed | Must be written as |
| --- | --- | --- |
| Frontend (unauthenticated) | - | PR:N |
| Backend | ordinary user | PR:L |
| Backend | administrator (admin) | PR:H |

- Do not use "SNMP / unix-agent / device side / mail / callback injection needs no login" to write a **backend** finding as PR:N. If exploitation needs an administrator to first register the attacker-controlled device, mailbox, webhook, SNMP agent, unix-agent, etc. into the system and then relies on polling/callback injection, set `attack_surface=backend` + `required_account=admin` (PR:H), not `user`. An ordinary user opening a page and getting hit is not frontend and not PR:L. Mark `frontend` / PR:N only when the attacker can send the payload directly through this application's public/unauthenticated endpoint without an administrator first registering an attacker-controlled source.
- Needing a login to change data or hit the endpoint → not PR:N. Needing an administrator account → PR:H, not PR:L.
- Needing a login is not AC:H (that is PR). An administrator first adding the attacker's device is also not PR:N. An ordinary user opening a page and getting hit is not PR:N / PR:L.

**Indirect consumer (exposure_mode=indirect_consumer)**
- Applies to JDBC connection pools / SQL firewalls (such as Druid WallFilter) / codec libraries / middleware consumers - things with **no direct HTTP/RPC entry point of their own**, where the flaw is only exploitable once "an upstream application passes attacker input into the component API".
- The report must state under **`### Trigger conditions`** that you cannot send a request to the component directly, and that an exploitable injection point must be found in the upstream business application (for example a SELECT-type SQLi whose statement passes through WallFilter).
- **AC must be H** (besides finding the component flaw you must also locate and complete the upstream chain, which the attacker cannot prepare alone).
- **AV must not be N** (the component has no direct network entry point); normally **AV:L** (triggered through the integrator's local call chain). Do not inflate the score with AV:N as a "remote SQLi".
- When the full upstream chain has not been proven at a real business HTTP/API entry point (only a harness or unit test calling the component API directly): **at most one of C/I/A may be H**; the value tier is **low_impact**; do not mark **frontend** or **cve_candidate**. Only pass `upstream_chain_proven=true` on Confirm, when the whole chain is proven, to relax this.

## How to choose each metric

**AV attack vector**
- N: remote network (HTTP/API, etc.) - the default.
- A: adjacent network only (same segment, Bluetooth, the layer 2 the monitored device sits on) - this is not "internal SSRF".
- L: local to the machine (reading local files, a local user). P: physical access.

**AC attack complexity**
- L by default. Mark H only when exploitation depends on conditions the attacker cannot prepare alone and that go beyond the default deployment (a race, a non-default switch on the target side that the attacker cannot flip).
- `config_premise=specific` does not automatically mean AC:H; consider H only when that configuration is not something the attacker can enable and is not a risk switch the vendor already warns about.
- Do not use AC:H to paper over "first I have to write a file myself" or "a second independent vulnerability".

**UI user interaction**
- N: sending the request is enough (SQLi, unauthenticated RCE, IDOR).
- R: the victim must also act (open a page, click a link, view an admin screen). XSS and CSRF are almost always R.

**S scope**
- C: the impact lands on another security authority (the browser). **XSS defaults to S:C.**
- U: the impact stays inside the same application (SQLi, RCE, file read/write, IDOR, SSRF reading resources the application can already read). Do not mark ordinary RCE/SQLi as S:C to inflate the score.

**C / I / A (only proven impact - do not borrow against "what could be done next")**
- H: confidentiality = core secrets obtained (credentials, private keys, the whole database, cloud keys); integrity = critical state or arbitrary code/files can be changed; availability = denial of service can be sustained or data destroyed.
- L: partial disclosure, partial tampering, brief or limited interruption.
- N: no impact on that dimension.

Type anchors (still adjust to the evidence; never use the type in reverse to inflate the score):
- **XSS (including stored)**: default `UI:R/S:C/C:L/I:L/A:N`. Do not mark C/I as H just because "cookies can be stolen / the account can be taken over / the admin panel can be clicked as the victim". NVD usually scores comparable stored XSS as C:L/I:L (around 5.4 / 6.1). Mark a dimension H only when the XSS has **already directly** produced high in-application integrity impact (1-click RCE, arbitrary file write, wiping the database).
- **SSRF**: with a response echo or internal data exfiltrated out of band, where metadata credentials or sensitive internal bodies have actually been read → C may be H; port or liveness probing only, or an outbound callback carrying no internal content → use L or N for C/I/A, and never mark H as credential theft.
- **Unauthenticated RCE / arbitrary file write / SQLi dumping the database**: usually S:U, with C/I/A following the proven impact; only H/H/H when full control is reached.
- **Information disclosure**: confidentiality only; ordinary user data C:L, keys or the whole database C:H; I:N A:N.
- **DoS**: mainly A; do not hand C/I an H along the way.

## Common mistakes (forbidden)

- Backend + user but written as `PR:N` (ConfirmVuln rejects this outright).
- XSS written as `C:H/I:H` to reach 9.3/9.6.
- Using S:C on a server-side finding with no cross-authority impact, to inflate the score.
- Using a complex vector to paper over planting a file, swapping the sink, or chaining a second vulnerability.

# CVSS 4.0 metrics

ConfirmVuln must also pass `cvss4_vector` (11 base metrics); do not fill in a score by hand, the system scores it per FIRST CVSS 4.0 and writes it into advisory.md / cve.json.
Vector: `CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N`
Values: AV=N|A|L|P, AC=L|H, AT=N|P, PR=N|L|H, UI=N|P|A, VC/VI/VA/SC/SI/SA=H|L|N.
PR rules are the same as 3.1. Score thresholds are the same.

**Mapping from 3.1**
- AT:N by default; AT:P only when exploitation also depends on a deployment condition the attacker cannot prepare alone (roughly the "extra condition" half of 3.1's AC:H).
- UI:N no interaction; UI:P passive (opening a page / viewing an admin screen is enough, the XSS default); UI:A also requires an active click. Do not write 3.1's UI:R.
- VC/VI/VA = vulnerable-system impact (corresponds to 3.1's C/I/A, and with S:U the subsequent systems are all N).
- SC/SI/SA = subsequent systems. All N when there is no crossing of a security boundary. Do not mark the subsequent systems of an ordinary RCE/SQLi as H.
- XSS defaults to `UI:P/VC:L/VI:L/VA:N/SC:N/SI:N/SA:N`; do not mark VC/VI as H for cookie / account takeover.
- Indirect consumer: AC:H, AV must not be N; at most one of VC/VI/VA is H when the upstream chain is unproven.