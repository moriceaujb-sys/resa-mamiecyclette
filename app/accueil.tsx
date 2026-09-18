import fs from "fs";
import path from "path";
import Link from "next/link";
import { CAPACITE, DUREE_MINUTES, LIEU_DEPART } from "@/lib/horaires";

// Vidéo de présentation (Vimeo, lien privé avec hash). `dnt=1` : pas de suivi
// publicitaire ni de cookies Vimeo tant que la vidéo n'est pas lancée.
const VIDEO_VIMEO_ID = "1223592504";
const VIDEO_VIMEO_HASH = "a3af39c028";
const VIDEO_URL = `https://player.vimeo.com/video/${VIDEO_VIMEO_ID}?h=${VIDEO_VIMEO_HASH}&dnt=1&title=0&byline=0&portrait=0`;

// Photo d'illustration à déposer dans public/. Tant qu'elle n'y est pas, on
// affiche une composition avec le logo pour ne jamais montrer d'image cassée.
const PHOTO = "/balade-triporteur.jpg";
function photoDisponible(): boolean {
  return fs.existsSync(path.join(process.cwd(), "public", PHOTO));
}

export default function Accueil() {
  const photo = photoDisponible();

  return (
    <div className="-mt-8">
      {/* Bandeau d'accroche pleine largeur (sort du conteneur max-w-4xl du layout). */}
      <section className="relative left-1/2 w-screen -translate-x-1/2 bg-white">
        <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-12 md:grid-cols-[1.15fr_1fr] md:py-16">
          <div>
            <p className="font-script text-3xl text-bordeaux-500 md:text-4xl">
              Quelques coups de pédale, une belle rencontre, un sourire.
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-tight text-marine-700 md:text-4xl">
              Et si vous offriez une balade à quelqu&apos;un qui ne peut plus
              pédaler seul&nbsp;?
            </h1>
            <p className="mt-5 text-lg text-slate-700">
              Avec <strong>Mamie Cyclette</strong>, devenez{" "}
              <strong>pédaleur volontaire</strong> et offrez à une personne âgée
              un moment de liberté, de plein air et de partage.
            </p>
            <p className="mt-3 text-lg text-slate-700">
              Une heure pour prendre l&apos;air, redécouvrir son quartier,
              discuter, sourire… <em>et créer une vraie rencontre.</em>
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/pedaleur?mode=inscription" className="btn-soleil">
                Je deviens pédaleur volontaire
              </Link>
              <Link href="/pedaleur" className="btn-ghost">
                J&apos;ai déjà un compte
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm md:max-w-none">
            <div
              aria-hidden="true"
              className="absolute -inset-3 -rotate-3 rounded-[2.5rem] bg-soleil-400/30"
            />
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={PHOTO}
                alt="Deux passagères souriantes saluent depuis le triporteur Mamie Cyclette, conduit par un pédaleur volontaire en gilet jaune."
                className="relative aspect-[3/4] w-full rounded-[2rem] object-cover shadow-md"
              />
            ) : (
              <div className="relative flex aspect-[3/4] w-full items-center justify-center rounded-[2rem] bg-creme shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/mamie-cyclette-logo.png"
                  alt="Mamie Cyclette"
                  className="w-2/3"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Le partenariat CCAS / Mamie Cyclette */}
      <section className="mx-auto max-w-3xl py-12 text-center">
        <p className="text-lg text-slate-700">
          À Angers, <strong>Mamie Cyclette et le CCAS unissent leurs forces</strong>{" "}
          pour permettre aux seniors de profiter de balades en triporteur
          accompagnées par des volontaires. Le CCAS met à disposition le
          triporteur et Mamie Cyclette coordonne les balades et accompagne les
          pédaleurs.
        </p>
      </section>

      {/* Comment ça marche */}
      <section aria-labelledby="titre-fonctionnement" className="py-4">
        <h2
          id="titre-fonctionnement"
          className="text-center text-2xl font-bold text-marine-700"
        >
          Comment ça marche&nbsp;?
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-3">
          <li className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="text-4xl" aria-hidden="true">
              🗓️
            </div>
            <h3 className="mt-3 text-lg font-bold text-marine-700">
              Une heure de balade
            </h3>
            <p className="mt-2 text-slate-700">
              Les lundis, mercredis et vendredis, quatre départs par jour ({DUREE_MINUTES}{" "}
              minutes chacun). {LIEU_DEPART}, à Angers.
            </p>
          </li>
          <li className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="text-4xl" aria-hidden="true">
              🚲
            </div>
            <h3 className="mt-3 text-lg font-bold text-marine-700">
              {CAPACITE} passagers, 1 pédaleur
            </h3>
            <p className="mt-2 text-slate-700">
              Le CCAS enregistre les personnes qui souhaitent une balade. Vous
              choisissez, depuis votre espace, le créneau que vous pouvez
              assurer.
            </p>
          </li>
          <li className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="text-4xl" aria-hidden="true">
              🤝
            </div>
            <h3 className="mt-3 text-lg font-bold text-marine-700">
              Vous êtes accompagné
            </h3>
            <p className="mt-2 text-slate-700">
              Pas besoin d&apos;être sportif : Mamie Cyclette vous forme au
              triporteur et reste à vos côtés pour organiser chaque sortie.
            </p>
          </li>
        </ul>
      </section>

      {/* Vidéo */}
      <section aria-labelledby="titre-video" className="py-12">
        <h2 id="titre-video" className="text-center text-2xl font-bold text-marine-700">
          Découvrez ce que vous allez partager
        </h2>
        <p className="mt-2 text-center text-lg text-slate-700">
          Une balade, une rencontre, un moment de liberté.
        </p>
        <div className="mt-6 overflow-hidden rounded-2xl bg-marine-700 shadow-md">
          <iframe
            src={VIDEO_URL}
            title="Mamie Cyclette : une balade en triporteur avec un pédaleur volontaire"
            className="aspect-video w-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      </section>

      {/* Appel à rejoindre */}
      <section className="rounded-3xl bg-marine-700 px-6 py-10 text-center text-white md:px-12">
        <h2 className="text-2xl font-bold md:text-3xl">Envie de pédaler avec nous&nbsp;?</h2>
        <p className="mx-auto mt-3 max-w-2xl text-lg text-marine-100">
          Rejoignez les pédaleurs volontaires de Mamie Cyclette et participez,
          vous aussi, à ces moments qui font du bien.
        </p>
        <Link href="/pedaleur?mode=inscription" className="btn-soleil mt-6">
          → Je deviens pédaleur volontaire
        </Link>
      </section>

      {/* Autres publics */}
      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-marine-700">
            Vous souhaitez profiter d&apos;une balade&nbsp;?
          </h2>
          <p className="mt-2 text-slate-700">
            Les balades sont proposées par le CCAS d&apos;Angers aux seniors, à
            leurs proches et aux structures (résidences, associations…). Prenez
            contact avec le CCAS : l&apos;équipe enregistre vos disponibilités et
            vous rappelle dès qu&apos;un pédaleur est trouvé.
          </p>
          <a
            href="https://www.angers.fr/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block font-medium text-marine-600 underline hover:text-marine-700"
          >
            Ville d&apos;Angers – CCAS
          </a>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-marine-700">Vous faites partie de l&apos;équipe&nbsp;?</h2>
          <p className="mt-2 text-slate-700">
            L&apos;espace équipe permet d&apos;enregistrer les bénéficiaires, de
            suivre les créneaux et de préparer les balades.
          </p>
          <Link
            href="/admin"
            className="mt-3 inline-block font-medium text-marine-600 underline hover:text-marine-700"
          >
            Accéder à l&apos;espace équipe
          </Link>
        </div>
      </section>
    </div>
  );
}
