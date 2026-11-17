import re,sys
src=open('site_raw/main-C7-oASSx.js').read()
i=src.index('vt();var q=e=>document.querySelector(e)')
body=src[:i]
body=body.replace('"./rooms-CujU6IZK.js"','"./rooms.mjs"').replace('"./three-C_nfZyvc.js"','"./three.mjs"')
body=body.replace('function Zc(e,t=!1){','function Zc(e,t=!1){if(globalThis.__HEADLESS_RIG)return globalThis.__HEADLESS_RIG(e);',1)
body+=';export{jf as Battle,N as CHARS,cf as Bot,sf as PROFILES,lo as BOSS,ko as Fighter,uf as Match,lf as Outcome,qe as DT,Kd as attackHeight};\n'
open('sim/game.mjs','w').write(body)
print(len(body))
