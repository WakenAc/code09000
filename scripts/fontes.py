"""Converte brand/fontes/Manrope[wght].ttf num woff2 servido localmente.

Limita o eixo wght a 400–600 (os pesos usados no site) e reduz ao latim
usado em português europeu. Correr: python scripts/fontes.py
"""
import io
import shutil
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset

raiz = Path(__file__).resolve().parent.parent
origem = raiz / "brand" / "fontes" / "Manrope[wght].ttf"
destino = raiz / "public" / "fontes"
destino.mkdir(parents=True, exist_ok=True)


buf = io.BytesIO()
instancer.instantiateVariableFont(TTFont(origem), {"wght": (400, 600)}).save(buf)
buf.seek(0)
fonte = TTFont(buf)  # recarregar evita tabelas preguiçosas desatualizadas
opcoes = subset.Options()
opcoes.flavor = "woff2"
opcoes.layout_features = ["kern", "liga", "calt", "case"]
opcoes.name_IDs = ["*"]
subsetter = subset.Subsetter(opcoes)
# Latim básico, Latim-1 e a pontuação usada no site (— · … ← « » “ ” ’ €).
subsetter.populate(unicodes=list(range(0x20, 0x7F)) + list(range(0xA0, 0x100))
                   + [0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D, 0x2026, 0x2190, 0x20AC, 0x2022])
subsetter.subset(fonte)
fonte.flavor = "woff2"
fonte.save(destino / "manrope.woff2")
shutil.copy(raiz / "brand" / "fontes" / "OFL.txt", destino / "OFL.txt")
print((destino / "manrope.woff2").stat().st_size, "bytes")
