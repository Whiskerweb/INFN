# Corpus du chatbot = uniquement le texte visible de la page DMN (pas les PDF).
import re,html
t=open("original.html",encoding="utf-8").read()
# compteurs animés : la valeur réelle est dans data-to-value
t=re.sub(r'(elementor-counter-number"[^>]*data-to-value="([^"]+)"[^>]*>)\s*0?\s*<',lambda m:m.group(1)+m.group(2).replace(".",",")+"<",t)
# liens des sites d'enseignement et des documents : on garde l'URL
def a(m):
    href,txt=m.group(1),re.sub(r"<[^>]+>|\s+"," ",m.group(2)).strip()
    if re.match(r"INFN |Trouver mon site|Formulaire de contact",txt): return f"{txt} ({href.split('?')[0]})"
    return m.group(2)
t=re.sub(r'<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>',a,t,flags=re.S)
t=re.sub(r"<script.*?</script>|<style.*?</style>|<noscript.*?</noscript>","",t,flags=re.S)
t=re.sub(r"<(h[1-6])[^>]*>","\n\n## ",t)
t=re.sub(r"<(br|/p|/li|/h[1-6]|/div)[^>]*>","\n",t)
t=re.sub(r"<li[^>]*>","\n- ",t)
x=html.unescape(re.sub(r"<[^>]+>"," ",t))
x="\n".join(re.sub(r"[ \t ]+"," ",l).strip() for l in x.split("\n"))
x=re.sub(r"\n{3,}","\n\n",x)
s=x.find("## Diplôme des métiers du notariat (DMN)"); e=x.find("© 2026")
body=x[s:e]
# retire les menus répétés du pied et le bloc « Navigation » (sommaire)
body=re.sub(r"\n## Navigation\n.*?(?=\n## Contacter le siège)",r"\n",body,flags=re.S)
body=re.sub(r"\n[ -]*(Télécharger)\n","\n",body)
body=re.sub(r"\n(?:- )?\n","\n",body)
body=re.sub(r"\n([\d,]+)\n%",r" : \1 %",body); body=re.sub(r"inscrits\n(\d+)",r"inscrits : \1",body); body=re.sub(r"\n##\s*\n","\n",body)
open("corpus-dmn.md","w",encoding="utf-8").write("Source : https://www.infn.fr/?formation=diplome-metiers-notariat\n\n"+body.strip()+"\n")
print(len(body.split()),"mots")
