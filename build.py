# Copie de la page DMN (original.html) sans mesure d'audience + maquette du chatbot.
import re
t=open("original.html",encoding="utf-8").read()
n0=len(t)
# Google tag (chargeur + configuration) et Matomo : retirés pour ne pas envoyer de visites à l'INFN
t=re.sub(r"<script[^>]*googletagmanager[^>]*></script>","",t)
t=re.sub(r"<script[^>]*>(?:(?!</script>).)*?gtag\((?:(?!</script>).)*</script>","",t,flags=re.S)
t=re.sub(r"<script[^>]*>(?:(?!</script>).)*?_paq(?:(?!</script>).)*</script>","",t,flags=re.S)
t=re.sub(r"<noscript><img[^>]*matomo[^>]*></noscript>","",t)
# ressources du site servies en même origine (relais local) pour que les polices d'icônes se chargent
t=t.replace("https://www.infn.fr/wp-content/","/wp-content/").replace("https://www.infn.fr/wp-includes/","/wp-includes/")
t=t.replace("https:\\/\\/www.infn.fr\\/wp-content\\/","\\/wp-content\\/").replace("https:\\/\\/www.infn.fr\\/wp-includes\\/","\\/wp-includes\\/")
inj='<link rel="stylesheet" href="widget/chatbot.css">\n<script src="widget/chatbot.js" defer></script>\n'
# maquette publique : non indexée, et signalée comme démonstration
t=t.replace("<head>","<head>\n<meta name=\"robots\" content=\"noindex, nofollow\">",1)
inj+='<div style="position:fixed;left:72px;bottom:22px;z-index:2147482000;font:600 11px/1 system-ui,sans-serif;color:#03256C;background:#fff;border:1px solid #D3E7F5;border-radius:999px;padding:7px 11px;box-shadow:0 6px 18px -8px rgba(3,37,108,.35)">Maquette de démonstration · Snipia</div>\n'
t=t.replace("</body>",inj+"</body>",1)
open("index.html","w",encoding="utf-8").write(t)
print("ok",n0,len(t),"gtag" in t,"matomo" in t.lower())
