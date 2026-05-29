from pathlib import Path

root = Path(__file__).resolve().parent.parent
html_path = root / "light-bootstrap-dashboard-angular2-master/src/app/Profil/profil.component.html"
snippet_path = Path(__file__).resolve().parent / "profil-forgot-snippet.html"

t = html_path.read_text(encoding="utf-8")
panel = snippet_path.read_text(encoding="utf-8")

link = """
                    <p class="profil-forgot-row">
                      <button type="button" class="btn btn-link btn-sm profil-forgot-link" (click)="toggleForgotPassword()">
                        <i class="glyphicon glyphicon-envelope"></i>
                        {{ forgotOpen ? 'Masquer' : 'Mot de passe oublié ?' }}
                      </button>
                    </p>
"""

marker = "                      Requis\n                    </div>\n                  </div>"
if "profil-forgot-row" not in t and marker in t:
    t = t.replace(marker, "                      Requis\n                    </div>\n" + link + "                  </div>", 1)

marker2 = "              </div>\n\n              <motion *ngIf=\"passwordChangeMessage\""
marker2 = "              </div>\n\n              <motion *ngIf=\"passwordChangeMessage\""
marker2 = "              </div>\n\n              <div *ngIf=\"passwordChangeMessage\""
if "profil-forgot-panel" not in t and marker2 in t:
    t = t.replace(marker2, "              </div>\n" + panel + "\n              <div *ngIf=\"passwordChangeMessage\"", 1)

html_path.write_text(t, encoding="utf-8")
print("OK", "profil-forgot-panel" in html_path.read_text(encoding="utf-8"))
