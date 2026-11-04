import numpy as np, json, subprocess, wave, sys
SR=48000
thr=float(sys.argv[1]); mind=float(sys.argv[2]); keepe=float(sys.argv[3]); target=float(sys.argv[4]); write=len(sys.argv)>5
raw=subprocess.run(["ffmpeg","-v","error","-i","klon.wav","-ac","1","-ar",str(SR),"-f","f32le","-"],capture_output=True).stdout
x=np.frombuffer(raw,np.float32).copy()
k=json.load(open("klon.kelimeler.json"))
x=x[:int((k[-2]["end"]+0.12)*SR)]
hop=int(0.01*SR)
fr=x[:len(x)//hop*hop].reshape(-1,hop)
db=20*np.log10(np.sqrt((fr**2).mean(1))+1e-9)
sil=db<thr
runs=[];i=0
while i<len(sil):
    if sil[i]:
        j=i
        while j<len(sil) and sil[j]: j+=1
        runs.append((i,j)); i=j
    else: i+=1
out=[];tmap=[];newpos=0;pos=0
def seg(a,b):
    global newpos
    out.append(x[a:b]); tmap.append((a/SR,newpos/SR)); newpos+=b-a; tmap.append((b/SR,newpos/SR))
# cümle sonu boşluğu biraz daha uzun kalsın
ends=[w["end"] for w in k if w["w"].endswith((".","?",":",";"))]
for (a,b) in runs:
    dur=(b-a)*0.01
    if dur>mind:
        t0=a*0.01
        ke=keepe*(1.7 if any(abs(t0-e)<0.4 for e in ends) else 1.0)
        cut0=0 if a==0 else int((a*0.01+ke)*SR); cut1=int((b*0.01-ke)*SR)
        if cut1>cut0: seg(pos,cut0); pos=cut1
seg(pos,len(x))
L=sum(len(s) for s in out)/SR
tempo=L/target
print(f"thr {thr} min {mind} keep {keepe}: sıkışmış {L:.1f}s tempo {tempo:.3f}")
if write:
    fade=int(0.006*SR); y=[]
    for s in out:
        s=s.copy()
        if len(s)>2*fade: s[:fade]*=np.linspace(0,1,fade); s[-fade:]*=np.linspace(1,0,fade)
        y.append(s)
    y=np.concatenate(y)
    with wave.open("klon_sik.wav","wb") as w: w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR);w.writeframes((y*32767).clip(-32768,32767).astype(np.int16).tobytes())
    subprocess.run(["ffmpeg","-y","-v","error","-i","klon_sik.wav","-af",f"atempo={tempo:.4f},highpass=f=70,acompressor=threshold=-20dB:ratio=3:attack=5:release=80,loudnorm=I=-15:TP=-1.5:LRA=7","-ar","48000","klon_final.wav"])
    to=np.array([a for a,b in tmap]); tn=np.array([b for a,b in tmap])
    nk=[{"w":w["w"],"start":round(float(np.interp(w["start"],to,tn))/tempo,3),"end":round(float(np.interp(w["end"],to,tn))/tempo,3)} for w in k[:-1]]
    json.dump(nk,open("klon_final.kelimeler.json","w"),ensure_ascii=False,indent=0)
    print("son kelime",nk[-1])
