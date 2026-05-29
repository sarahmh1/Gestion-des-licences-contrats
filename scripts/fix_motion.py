from pathlib import Path
import sys

OPEN_M = "<" + "m" + "otion"
CLOSE_M = "</" + "m" + "otion" + ">"
OPEN_D = "<" + "d" + "i" + "v"
CLOSE_D = "</" + "d" + "i" + "v" + ">"

for path in sys.argv[1:]:
    p = Path(path)
    t = p.read_text(encoding="utf-8")
    t = t.replace(CLOSE_M, CLOSE_D)
    t = t.replace(OPEN_M, OPEN_D)
    p.write_text(t, encoding="utf-8")
    print("fixed", path)
