# 🐰 Puszek i marchewki kontra Persi

Pixel-artowa platformówka w **jednym pliku HTML**: bez instalacji i bez bibliotek, działa w przeglądarce na komputerze i telefonie.
Bohaterowie mają prawdziwe pierwowzory: królika **Puszka** (biały, z grzywką i krótkimi brzoskwiniowymi uszkami) i kota **Persiego** (bury tygrysek z literą „M” na czole).

### ▶ [Zagraj](https://mariuszbelka.github.io/przygody-krolika/)

![Menu](docs/menu.png)

## O grze
Puszek wędruje przez osiem krain po marchewki i diamenty, a po drodze zastawia na niego pułapki Persi.
Każda kraina ma własną mechanikę:

| # | Kraina | Mechanika |
|---|---|---|
| 1 | Łąka | grzyby-trampoliny |
| 2 | Pagórki | toczące się kapusty |
| 3 | Las (w deszczu) | kłody spadające chwilę po wejściu |
| 4 | Chmury | wiatr: pod wiatr i z wiatrem |
| 5 | Strumień | lilie tonące pod Puszkiem |
| 6 | Ogród | zraszacze wystrzeliwujące w górę |
| 7 | Zamek | kruszące się cegły i chowające się kolce |
| 8 | Finał | Wielki Persi i spadające kłębki włóczki |

Za każdy poziom można zdobyć do 3 gwiazdek: za metę, za wszystkie diamenty i za przejście bez utraty serca.
Śpiącego Persiego da się minąć na paluszkach, a tupnięcie z powietrza go ogłusza.

![Mapa przygody](docs/mapa.png)
![Pagórki](docs/pagorki.png)
![Finał](docs/final.png)

## Sterowanie
| Komputer | Akcja |
|---|---|
| A / D lub ← / → | ruch |
| Spacja / W / ↑ | skok (drugi skok w locie) |
| X | rzut bobkiem |
| S / ↓ | w locie tupnięcie, na ziemi skradanie |
| Esc | pauza |
| M | muzyka |

Na telefonie duże przyciski pojawiają się pod planszą. Najwygodniej grać poziomo, w trybie pełnoekranowym.

## Ranking dla znajomych (hall of fame)
Ranking działa tylko z linku z kodem ekipy:

```
https://mariuszbelka.github.io/przygody-krolika/?ekipa=znajomi
```

Każdy kod (litery, cyfry, myślnik) to osobna tabela wyników. Wynik trafia do rankingu po przejściu całej przygody od poziomu 1 albo po utracie wszystkich serc.
Bez kodu w linku gra działa normalnie, tylko bez rankingu.

Wyniki przechowuje Supabase (darmowy plan). Schemat tabeli jest w [`supabase_ranking.sql`](supabase_ranking.sql).
Klucz `sb_publishable_…` w kodzie jest publiczny z założenia. Dostęp ogranicza RLS: wolno tylko czytać i dopisywać.
Ranking chroni wyłącznie nieznajomość linku, więc nie jest zabezpieczony przed wpisaniem fałszywego wyniku.

## Technicznie
- Jeden plik `index.html`, czysty JavaScript i Canvas 2D, logiczna rozdzielczość 800×480 z ostrym renderingiem HiDPI.
- Proceduralny pixel-art: sprite'y generowane w kodzie, z cieniowaniem i światłem.
- Muzyka i efekty generowane na żywo przez WebAudio, bez plików dźwiękowych.
- Czcionki (Fredoka, Press Start 2P) są wbudowane w plik, więc gra wygląda tak samo offline.
- Postęp (gwiazdki, najlepsze czasy) zapisuje się lokalnie w przeglądarce.
- Wszystkie poziomy przeszedł automatyczny bot bez utraty serca. Precyzję skoków mierzono z celowo „rozjechanym” timingiem ±50 i ±100 ms.

## Uruchomienie lokalne
Wystarczy otworzyć `index.html` w przeglądarce.
