# 🐰 Przygody Puszka i Persiego

Gry przeglądarkowe o króliku **Puszku** (biały, z grzywką i krótkimi brzoskwiniowymi uszkami) i kocie **Persim** (bury tygrysek z literą „M” na czole). Bez instalacji, działają na komputerze i telefonie.

### ▶ [Strona główna: wybierz grę](https://mariuszbelka.github.io/przygody-krolika/)

| Gra | Typ | Link |
|---|---|---|
| Przygoda 1: Puszek i marchewki | platformówka, 8 krain | [`/przygoda1/`](https://mariuszbelka.github.io/przygody-krolika/przygoda1/) |
| Przygoda 2: Sroka Złodziejka | zagadki, 15 pokoi | [`/przygoda2/`](https://mariuszbelka.github.io/przygody-krolika/przygoda2/) |
| Przygoda 3: Zaczarowany Las | platformówka, 3 krainy, 13 poziomów | [`/przygoda3/`](https://mariuszbelka.github.io/przygody-krolika/przygoda3/) |

Strona główna (`index.html`) pozwala wybrać typ gry (skakanie albo zagadki) i przygodę. Pokazuje też zdobyte gwiazdki i przekazuje kod ekipy `?ekipa=` do każdej gry.

## Przygoda 1: Puszek i marchewki (`/przygoda1/`)
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

Strona główna przekaże kod do Przygody 1 i 3 (każda ma osobny ranking, Przygoda 3 osobno dla trybu Spokojnie i Czadowo).

```
```

Każdy kod (litery, cyfry, myślnik) to osobna tabela wyników. Wynik trafia do rankingu po przejściu całej przygody od poziomu 1 albo po utracie wszystkich serc.
Bez kodu w linku gra działa normalnie, tylko bez rankingu.

Wyniki przechowuje Supabase (darmowy plan). Schemat tabeli jest w [`supabase_ranking.sql`](supabase_ranking.sql).
Klucz `sb_publishable_…` w kodzie jest publiczny z założenia. Dostęp ogranicza RLS: wolno tylko czytać i dopisywać.
Ranking chroni wyłącznie nieznajomość linku, więc nie jest zabezpieczony przed wpisaniem fałszywego wyniku.

## Technicznie
- Jeden plik `przygoda1/index.html`, czysty JavaScript i Canvas 2D, logiczna rozdzielczość 800×480 z ostrym renderingiem HiDPI.
- Proceduralny pixel-art: sprite'y generowane w kodzie, z cieniowaniem i światłem.
- Muzyka i efekty generowane na żywo przez WebAudio, bez plików dźwiękowych.
- Czcionki (Fredoka, Press Start 2P) są wbudowane w plik, więc gra wygląda tak samo offline.
- Postęp (gwiazdki, najlepsze czasy) zapisuje się lokalnie w przeglądarce.
- Wszystkie poziomy przeszedł automatyczny bot bez utraty serca. Precyzję skoków mierzono z celowo „rozjechanym” timingiem ±50 i ±100 ms.

## Uruchomienie lokalne
Wystarczy otworzyć `index.html` (strona główna) albo plik wybranej gry w przeglądarce.

## Przygoda 2: Sroka Złodziejka (`/przygoda2/`)
Turowa gra logiczna: Puszek i Persi działają razem przeciw Sroce Szarlotce. Liczy się kombinowanie, a nie refleks.
Przełączasz postacie, ruch można cofać, są podpowiedzi.

| Puszek | Persi |
|---|---|
| wskakuje na 1 kratkę | wskakuje na 2 kratki |
| kopie miękką ziemię | pcha skrzynki |
| przechodzi przez nory | drapie liny |

Obie postacie mogą wejść jedna na drugą, stanąć na płycie i przełączyć dźwignię.
Gra ma 15 pokoi w 4 krainach (Ogród, Szopa, Piwnica, Wieża Sroki).

**Sterowanie:** ← → ruch, Spacja akcja, Tab zmiana postaci, Z cofnij, R od nowa, H podpowiedź.

Każdy pokój sprawdza solver BFS (`przygoda2/tools/solve.js`). Ten sam plik `rules.js` steruje grą i solverem.
Solver wyznacza też liczbę ruchów „mistrza”: minimum +10%.
`tools/check.js` sprawdza, czy skrzynki, nory i ziemia są w pokoju naprawdę potrzebne.

## Przygoda 3: Zaczarowany Las (`/przygoda3/`)
Szybka platformówka na silniku z części 1. Leśne Licho zaczarowało las; pokonani wrogowie zostają **odczarowani**.
W menu wybierasz bohatera i tryb:

| | Umiejętności |
|---|---|
| **Puszek** | podwójny skok, bobki, tupnięcie |
| **Persi** | szybszy, skacze wyżej, wspina się po pnączach, zryw z pazurkami przebija wrogów |

| Tryb | Różnice |
|---|---|
| **Spokojnie** | wrogowie i pościgi wolniejsze, bossowie mają mniej serc i dłużej ostrzegają, upadek w przepaść nie zabiera serca |
| **Czadowo** | pełna trudność |

| Kraina | Poziomy | Nowości |
|---|---|---|
| 1 · Polana Grzybów | Leśna ścieżka, Korony drzew, Jeżynowy gąszcz, pościg Wiatrołom, boss **Grzybowy Król** | muchomorki, żabki, jeże, wiewiórki z szyszkami, Bzyczki, pnącza |
| 2 · Mokradła i Mgła | Błotna grobla, Mglisty gąszcz, pościg Błotna fala, boss **Ropuch Mgielnik** | tonące lilie, spadające kłody, błoto (wolniej, niżej), mgła, **Korzeniak** (zapowiada go drżenie ziemi; tupnięcie wyrywa go spod ziemi) |
| 3 · Drzewo Licha | Nocny las, Korzenie Drzewa, pościg Gniew Licha, finał **Leśne Licho** | noc z oświetleniem, **sowy** pikujące po cieniu, kruszące się kamienie |

Bossowie mają po 3 fazy. Po każdym trafieniu odskakują i są chwilę nietykalni. Zryw i taran się od nich odbijają.
- **Grzybowy Król:** szarże, fale uderzeniowe, salwy zarodników, przywołuje muchomorki.
- **Ropuch Mgielnik:** skacze z falą przy każdym lądowaniu, pluje błotem, woła żabki.
- **Leśne Licho:** znika i pojawia się obok gracza, rzuca ognikami, budzi Korzeniaki.

**Zbieranie:** żołędzie z mnożnikiem serii, słoiki ze świetlikami (gwiazdka), złote żołędzie w sekretach. Moce: magnes, bańka, Turbo-marchew.

Gra jest generowana z kodu Przygody 1: `przygoda3/tools/patch_p3.py` łączy `przygoda1/index.html` z plikami `p3_levels.js` (poziomy z segmentów), `p3_add.js`, `p3_draw.js` i `p3_map.js`.
Walidator osiągalności (`tools/validate3.js`) sprawdza dla obu postaci metę i wszystkie słoiki na każdym poziomie.
