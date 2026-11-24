#!/usr/bin/env bash
# Purga .env del historial de Git SIN tocar el working tree original.
# Trabaja en dos clones: uno espejo de respaldo y uno donde se reescribe.
# NO hace push: al terminar imprime los comandos exactos para que los confirmes y ejecutes.
set -euo pipefail

REPO="$(git rev-parse --show-toplevel)"
ORIGIN="$(git -C "$REPO" remote get-url origin || true)"
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP="${REPO}-env-backup-${STAMP}"
REWRITE="${REPO}-env-rewrite-${STAMP}"

echo "Repositorio: $REPO"
echo "Remote:      ${ORIGIN:-<sin remote>}"

if ! command -v git-filter-repo >/dev/null 2>&1; then
  echo
  echo "Necesitas git-filter-repo. Instálalo con una de estas opciones:"
  echo "  brew install git-filter-repo"
  echo "  python3 -m pip install --user git-filter-repo"
  echo
  echo "Vuelve a ejecutar este script después de instalarlo."
  exit 1
fi

if [ -z "$ORIGIN" ]; then
  echo "ERROR: no hay remote origin; no se puede verificar el push posterior."
  exit 1
fi

if ! git -C "$REPO" log --all --oneline -- .env | grep -q .; then
  echo "No hay commits con .env en el historial. Nada que purgar."
  exit 0
fi

echo
echo "Commits con .env que se van a reescribir:"
git -C "$REPO" log --all --oneline -- .env

echo
echo "1/4  Creando respaldo espejo (no se modifica): $BACKUP"
git clone --mirror "$REPO" "$BACKUP"

echo "2/4  Clonando para reescribir: $REWRITE"
git clone "$REPO" "$REWRITE"

echo "3/4  Reescribiendo historial (eliminando .env de TODOS los commits)..."
cd "$REWRITE"
git filter-repo --invert-paths --path .env --force

echo "4/4  Verificando..."
if git log --all --format='%H' -- .env | grep -q .; then
  echo "ERROR: la verificación falló; quedaron commits con .env."
  echo "El respaldo está intacto en: $BACKUP"
  exit 1
fi
if [ -n "$(git status --porcelain)" ]; then
  echo "ERROR: el clon reescrito tiene cambios sin confirmar."
  echo "El respaldo está intacto en: $BACKUP"
  exit 1
fi

echo
echo "OK: .env ya no aparece en ningún commit del clon reescrito."
echo "Respaldo original: $BACKUP"
echo
echo "NO se ha hecho push. Para publicar la reescritura, ejecuta (revisa la URL):"
echo
echo "  cd '$REWRITE'"
echo "  git remote add origin '$ORIGIN'"
echo "  git push --force --all origin"
echo "  git push --force --tags origin"
echo
echo "Después del push:"
echo "  - Verifica: git log --all -p -- .env   (debe estar vacío)"
echo "  - Avisa a todos los colaboradores: deben volver a clonar o rebasear."
echo "  - Cierra/rota las claves que aún estén activas (RESEND_API_KEY, GEMINI_API_KEY)."
echo "  - GitHub puede seguir mostrando commits antiguos en caché durante un tiempo."
