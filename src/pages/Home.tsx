import UploadCard from "../components/UploadCard";
import AppHeader from "../components/Appheader";

export default function Home() {
    return (
        <div className="min-h-screen bg-cream">

            <AppHeader />

            <main className="mx-auto max-w-5xl px-6 py-16">

                <h1 className="mt-2 font-display text-5xl font-bold text-ink">
                    Extração de Dados
                </h1>

                <p className="mt-4 max-w-2xl text-lg text-gray-600">
                    Faça o upload de uma ficha médica em PDF para extrair automaticamente
                    as informações utilizando o mecanismo do SophIA.
                </p>

                <UploadCard />

            </main>

        </div>
    );
}