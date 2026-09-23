export default function LoginIllustration() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-blush-soft">
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-salmon-light blur-3xl" />
      <div className="absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-blush blur-3xl" /> 
      <div className="absolute right-14 top-16 h-44 w-44" >
        <img src="/public/LogoNav.svg" alt="Baby" />
      </div>
      <div className="absolute bottom-28 left-16 h-10 w-10 rounded-full bg-salmon/40" />
      <div className="absolute left-10 top-1/3 h-6 w-6 rounded-full bg-maroon/30" />

      <div className="relative flex h-100 w-100 items-center justify-center rounded-[3rem] shadow-2xl shadow-blush/20">
  
          <img src="/public/Baby birth-cuate 1.png" alt="Baby" />
        
      </div>

      <div className="absolute bottom-16 left-1/2 w-72 -translate-x-1/2 rounded-2xl bg-white/80 p-4 text-center shadow-sm backdrop-blur">
        <p className="font-display text-sm font-semibold text-espresso">
          Ciência de dados a serviço da vida neonatal
        </p>
      </div>
    </div>
  );
}