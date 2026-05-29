#!/usr/bin/env python3
"""Add confirm-delete modal pattern to afficher components."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "light-bootstrap-dashboard-angular2-master" / "src" / "app"

MODAL_SNIPPET = '''
<app-confirm-delete-modal
  [visible]="showDeleteModal"
  message="{message}"
  [detail]="deleteModalDetail"
  [canConfirm]="{perm}"
  (cancel)="closeDeleteModal()"
  (confirm)="{confirm}()">
</app-confirm-delete-modal>
'''

ENTRIES = [
    ("Wallix/afficherw/afficherw.component", "deleteWallix", "requestDeleteWallix", "confirmDeleteWallix", "wallixId", "wallix", "cette licence Wallix", "permissionService.canDeleteProduct('wallix')", "w", "selectedWallix"),
    ("VMware/afficherv/afficherv.component", "deleteVMware", "requestDeleteVMware", "confirmDeleteVMware", "vmwareId", "vmware", "cette licence VMware", "permissionService.canDeleteProduct('vmware')", "v", "selectedVMware"),
    ("Varonis/affichervr/affichervr.component", "deleteVaronis", "requestDeleteVaronis", "confirmDeleteVaronis", "varonisId", "varonis", "cette licence Varonis", "permissionService.canDeleteProduct('varonis')", "x", "selectedVaronis"),
    ("Splunk/afficher-splunk/afficher-splunk.component", "deleteSplunk", "requestDeleteSplunk", "confirmDeleteSplunk", "splunkid", "splunk", "cette licence Splunk", "permissionService.canDeleteProduct('splunk')", "s", "selectedSplunk"),
    ("SentineIOne/affichers/affichers.component", "deleteSentineIOne", "requestDeleteSentineIOne", "confirmDeleteSentineIOne", "sentineIOneId", "sentineione", "cette licence SentinelOne", "permissionService.canDeleteProduct('sentineione')", "x", "selectedSentineIOne"),
    ("Rapid7/afficher-rapid7/afficher-rapid7.component", "deleteRapid7", "requestDeleteRapid7", "confirmDeleteRapid7", "rapid7Id", "rapid7", "cette licence Rapid7", "permissionService.canDeleteProduct('rapid7')", "x", "selectedRapid7"),
    ("SecPoint/affichers/affichers.component", "deleteSecPoint", "requestDeleteSecPoint", "confirmDeleteSecPoint", "secPointId", "secpoint", "cette licence SecPoint", "permissionService.canDeleteProduct('secpoint')", "x", "selectedSecPoint"),
    ("Profpoint/afficher-proofpoint/afficher-proofpoint.component", "deleteProofpoint", "requestDeleteProofpoint", "confirmDeleteProofpoint", "proofpointId", "profpoint", "cette licence Proofpoint", "permissionService.canDeleteProduct('profpoint')", "p", "selectedProofpoint"),
    ("OneIdentity/affichero/affichero.component", "deleteOneIdentity", "requestDeleteOneIdentity", "confirmDeleteOneIdentity", "oneIdentityId", "oneidentity", "cette licence One Identity", "permissionService.canDeleteProduct('oneidentity')", "x", "selectedOneIdentity"),
    ("Netskope/affichern/affichern.component", "deleteNetskope", "requestDeleteNetskope", "confirmDeleteNetskope", "netskopeId", "netskope", "cette licence Netskope", "permissionService.canDeleteProduct('netskope')", "x", "selectedNetskope"),
    ("MicrosoftO365/afficherm/afficherm.component", "deleteMicrosoftO365", "requestDeleteMicrosoftO365", "confirmDeleteMicrosoftO365", "microsoftO365Id", "microsofto365", "cette licence Microsoft O365", "permissionService.canDeleteProduct('microsofto365')", "x", "selectedMicrosoftO365"),
    ("Infoblox/afficheri/afficheri.component", "deleteInfoblox", "requestDeleteInfoblox", "confirmDeleteInfoblox", "infobloxId", "infoblox", "cette licence Infoblox", "permissionService.canDeleteProduct('infoblox')", "x", "selectedInfoblox"),
    ("Imperva/afficherim/afficherim.component", "deleteImperva", "requestDeleteImperva", "confirmDeleteImperva", "impervaId", "imperva", "cette licence Imperva", "permissionService.canDeleteProduct('imperva')", "x", "selectedImperva"),
    ("F5/afficherf/afficherf.component", "deleteF5", "requestDeleteF5", "confirmDeleteF5", "f5Id", "f5", "cette licence F5", "permissionService.canDeleteProduct('f5')", "x", "selectedF5"),
    ("Fortra/afficherfortra/afficherfortra.component", "deleteFortra", "requestDeleteFortra", "confirmDeleteFortra", "fortraId", "fortra", "cette licence Fortra", "permissionService.canDeleteProduct('fortra')", "x", "selectedFortra"),
    ("Bitdefender/afficherb/afficherb.component", "deleteBitdefender", "requestDeleteBitdefender", "confirmDeleteBitdefender", "bitdefenderId", "bitdefender", "cette licence Bitdefender", "permissionService.canDeleteProduct('bitdefender')", "x", "selectedBitdefender"),
    ("Alwarebytes/affichera/affichera.component", "deleteAlwarebytes", "requestDeleteAlwarebytes", "confirmDeleteAlwarebytes", "alwarebytesId", "alwarebytes", "cette licence Malwarebytes", "permissionService.canDeleteProduct('alwarebytes')", "x", "selectedAlwarebytes"),
    ("Veeam/affichervee/affichervee.component", "deleteVeeam", "requestDeleteVeeam", "confirmDeleteVeeam", "veeamId", "veeam", "cette licence Veeam", "permissionService.canDeleteProduct('veeam')", "v", "selectedVeeam"),
    ("Palo/afficher-palo/afficher-palo.component", "deletePalo", "requestDeletePalo", "confirmDeletePalo", "paloId", "palo", "cette licence Palo Alto", "permissionService.canDeleteProduct('palo')", "p", "selectedPalo"),
    ("Cisco/afficherc/afficherc.component", "deleteCisco", "requestDeleteCisco", "confirmDeleteCisco", "ciscoId", "cisco", "cette licence Cisco", "permissionService.canDeleteProduct('cisco')", "x", "selectedCisco"),
]


def patch_ts(ts_path: Path, delete_fn: str, request_fn: str, confirm_fn: str, id_prop: str):
    text = ts_path.read_text(encoding="utf-8", errors="replace")
    if "showDeleteModal" in text:
        return False
    esc = re.escape(delete_fn)
    pattern = (
        r"(\s*)" + esc + r"\(id: [^)]+\): void \{\s*"
        r"if \(id != null && confirm\([^)]+\)\) \{\s*"
        r"(this\.[\w]+\." + esc + r"\(id\)\.subscribe\(\s*"
        r"\(\) => \{[\s\S]*?\}\s*,\s*"
        r"error\s*=>\s*\{[\s\S]*?\}\s*\)\s*;?\s*)\s*\}\s*\}\s*"
    )
    m = re.search(pattern, text)
    if not m:
        print(f"  SKIP TS pattern: {ts_path}")
        return False
    indent = m.group(1)
    subscribe_body = m.group(2).strip()
    # inject closeDeleteModal in success callback
    if "closeDeleteModal" not in subscribe_body:
        subscribe_body = re.sub(
            r"(\(\) => \{)",
            r"\1\n        this.closeDeleteModal();",
            subscribe_body,
            count=1,
        )
    block = f"""{indent}showDeleteModal = false;
{indent}deleteModalDetail = '';
{indent}private pendingDeleteId: number | null = null;

{indent}{request_fn}(item: {{ {id_prop}?: number; client?: string }}): void {{
{indent}  const id = item?.{id_prop};
{indent}  if (id == null) return;
{indent}  this.pendingDeleteId = id;
{indent}  this.deleteModalDetail = item.client ? 'Client : ' + item.client : '';
{indent}  this.showDeleteModal = true;
{indent}}}

{indent}closeDeleteModal(): void {{
{indent}  this.showDeleteModal = false;
{indent}  this.pendingDeleteId = null;
{indent}  this.deleteModalDetail = '';
{indent}}}

{indent}{confirm_fn}(): void {{
{indent}  const id = this.pendingDeleteId;
{indent}  if (id == null) return;
{indent}  {subscribe_body}
{indent}}}"""
    text = text[: m.start()] + block + text[m.end() :]
    ts_path.write_text(text, encoding="utf-8")
    return True


def patch_html(html_path: Path, delete_fn: str, request_fn: str, confirm_fn: str, id_prop: str, list_var: str, selected_var: str, message: str, perm: str):
    text = html_path.read_text(encoding="utf-8")
    if "app-confirm-delete-modal" in text and request_fn in text:
        return False
    text = re.sub(
        rf"\(click\)=\"{delete_fn}\(\s*{list_var}\.{id_prop}\s*\)\"",
        f'(click)="{request_fn}({list_var})"',
        text,
    )
    text = re.sub(
        rf"\(click\)=\"{delete_fn}\(\s*{selected_var}\.{id_prop}\s*\)\"",
        f'(click)="{request_fn}({selected_var})"',
        text,
    )
    snippet = MODAL_SNIPPET.format(message=f"Êtes-vous sûr de vouloir supprimer {message} ?", perm=perm, confirm=confirm_fn)
    text = text.rstrip() + snippet
    html_path.write_text(text, encoding="utf-8")
    return True


def main():
    for entry in ENTRIES:
        base = entry[0]
        delete_fn, request_fn, confirm_fn, id_prop = entry[1:5]
        message, perm, list_var, selected_var = entry[6], entry[7], entry[8], entry[9]
        ts = ROOT / f"{base}.ts"
        html = ROOT / f"{base}.html"
        print(base)
        if ts.exists():
            patch_ts(ts, delete_fn, request_fn, confirm_fn, id_prop)
        if html.exists():
            patch_html(html, delete_fn, request_fn, confirm_fn, id_prop, list_var, selected_var, message, perm)


if __name__ == "__main__":
    main()
