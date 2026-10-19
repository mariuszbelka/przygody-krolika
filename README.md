# 🐰 Przygody Puszka i Persiego

Gry przeglądarkowe o króliku **Puszku** (biały, z grzywką i krótkimi brzoskwiniowymi uszkami) i kocie **Persim** (bury tygrysek z literą „M” na czole). Bez instalacji, działają na komputerze i telefonie.

### ▶ [Strona główna: wybierz grę](https://mariuszbelka.github.io/przygody-krolika/)

| Gra | Typ | Link |
|---|---|---|
| Przygoda 1: Puszek i marchewki | platformówka, 8 krain | [`/przygoda1/`](https://mariuszbelka.github.io/przygody-krolika/przygoda1/) |
| Przygoda 2: Sroka Złodziejka | zagadki, 15 pokoi | [`/przygoda2/`](https://mariuszbelka.github.io/przygody-krolika/przygoda2/) |
| Przygoda 3: Zaczarowany Las | platformówka, 3 krainy, 13 poziomów | [`/przygoda3/`](https://mariuszbelka.github.io/przygody-krolika/przygoda3/) |
| Przygoda 4: Ogród Babci Ludwiki | układanka „3 w rzędzie”, 18 poziomów | [`/przygoda4/`](https://mariuszbelka.github.io/przygody-krolika/przygoda4/) |

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

## Przygoda 4: Ogród Babci Ludwiki (`/przygoda4/`)
Układanka „3 w rzędzie”. Sroka Szarlotka narobiła bałaganu w ogrodzie babci, a każdy wygrany poziom dodaje jeden z 18 elementów ogrodu: grządkę truskawek, płotek, słoneczniki, karmnik, jabłoń, budkę Persiego, huśtawkę, staw z rybką, altankę i tak dalej.
Nowy element spada do ogrodu z odbiciem, kamera na niego najeżdża, a babcia Ludwika, Puszek i Persi się cieszą. Na mapie można przełączać widok „Poziomy” i „Ogród” – w ogrodzie wszystko żyje (huśtawka, pszczoły, rybka w stawie, para nad szarlotką).
Dotknięcie Puszka albo Persiego w trakcie gry wywołuje sztuczkę (salto, binky, kichnięcie, chrupanie marchewki, pogoń za ogonem, przeciąganie się, mruczenie…); gdy moc jest naładowana, dotknięcie ją włącza.
Owoce: truskawka, jabłko, śliwka, cytryna, borówka, morela. Działa w pionie i w poziomie, myszą i palcem.

| Ułożenie | Kafelek | Efekt |
|---|---|---|
| 4 w linii | marchew-rakieta | czyści rząd albo kolumnę |
| kwadrat 2×2 | motylek | leci w najbardziej potrzebne pole |
| L / T | dynia-bomba | wybuch 3×3 |
| 5 w linii | kłębek Persiego | znika cały kolor |

Dwa specjalne zamienione ze sobą dają kombinację (np. rakieta + bomba = 3 rzędy i 3 kolumny, kłębek + rakieta = cały kolor zmienia się w rakiety).
Zbite jabłka ładują Puszka (czyści kolumnę), śliwki – Persiego (czyści rząd).
Cele: zebrać owoce, oczyścić chwasty, rozbić skrzynki, zerwać pajęczyny, sprowadzić słoiki z konfiturą na dół i pokonać Srokę, która zakrywa owoce błyskotkami.
Tryby: **Spokojnie** (więcej ruchów, po ich końcu babcia daje +5) i **Czadowo** (koniec ruchów = przegrana). Zostałe ruchy zamieniają się w rakiety („wielkie sprzątanie”).

Logika (`rules.js`) jest czysta i działa też w Node:
- `tools/test.js` gra setki partii na każdym poziomie i sprawdza, czy animacje odtwarzane z kroków zgadzają się z planszą, czy nie ma dziur ani gotowych trójek i czy zawsze jest możliwy ruch.
- `tools/sim.js` to symulator Monte Carlo, który ustawia liczbę ruchów (szansa wygranej gracza modelowego: ok. 90% na początku, ok. 60% przy Sroce) i progi gwiazdek.
Debug: `?poziom=N` otwiera od razu poziom N, `?odblokuj` odblokowuje wszystkie.
