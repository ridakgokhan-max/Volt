"""Seslendirme temizleme zinciri (her kayıtta kullanılır).

Sıra: uğultu kesme -> duraklamalarda oda sesini kısma -> boğukluğu alma (250-600 Hz) -> sıcaklık (180 Hz)
      -> netlik (3.5 kHz) -> parlaklık -> 's' sesi yumuşatma -> sıkıştırma
(Spektral gürültü azaltma denendi; bu kayıtlarda oda sesini artırdığı için kullanılmıyor.)
Kullanım: python scripts/ses_temizle.py girdi cikti.wav
"""
import subprocess
import sys

ZINCIR = ",".join([
    "highpass=f=75",
    "agate=threshold=0.006:ratio=6:attack=4:release=220:range=0.08",
    "equalizer=f=400:t=q:w=1.2:g=-3.5",
    "equalizer=f=180:t=q:w=1.0:g=1.5",
    "equalizer=f=3500:t=q:w=1.2:g=3.5",
    "treble=g=1.5:f=9000",
    "deesser=i=0.35:m=0.5:f=0.5",
    "acompressor=threshold=-22dB:ratio=2.5:attack=8:release=150:makeup=4",
    "alimiter=limit=0.89:level=false",
])


def temizle(girdi, cikti, sr=48000):
    subprocess.run(["ffmpeg", "-y", "-nostdin", "-loglevel", "error", "-i", girdi, "-ac", "1", "-ar", str(sr), "-af", ZINCIR, cikti], check=True)
    return cikti


if __name__ == "__main__":
    temizle(sys.argv[1], sys.argv[2])
    print("temizlendi:", sys.argv[2])
