# Morse App
**Kari Maaheimo (M1998)**  

Mobiiliprojekti, jonka tavoitteena on luoda mobiilisovellus, jota voi hyödyntää morsekoodin oppimiseen.  
Projektin suunnitelmat löytyvät projektin **Wikistä**. Wiki on englanniksi kun ehdin kirjoittaa sen ennen kuin päätin jatkaa suomeksi, enkä jaksa enää kääntää.  


## Lopputuotos

[**Projektin viimeisin Expo-julkaisu**](https://expo.io/@rothary/projects/MorseApp)  

### Hyödynnetyt kirjastot sun muut

* [React native elements - checkbox](https://reactnativeelements.com/docs/checkbox/)  
* [React native elements - slider](https://reactnativeelements.com/docs/slider)
* [FontAwesome icons](https://github.com/FortAwesome/react-native-fontawesome)
* [Expo Audio](https://docs.expo.io/versions/latest/sdk/audio/)
* [AsyncStorage](https://reactnative.dev/docs/asyncstorage)
* Sovelluksen "Custom list" osion koodi on enimmäkseen peräisin Mobile Development -kurssin "to do list" harjoituksesta

### Video ja kuvat
[**Videodemo**](https://youtu.be/OOelaOIh1Ps)  

![](https://i.imgur.com/zzoO6kv.png)
![](https://i.imgur.com/YS9a1jm.png)
![](https://i.imgur.com/HtgW9va.png)
![](https://i.imgur.com/ydjP54E.png)
![](https://i.imgur.com/20Yj6P5.png)

## Käytetyt tunnit

#### Yhteensä: **64h**
Suunnittelu: 11h  
Koodaaminen: 52h

| pvm | Mitä tehty | Tunnit |
| :---: |:-------| :-----: |
| ennen viikkoa 46 | Suunnittelua ja konseptin ideoimista | 4h |
| 12.11 | Suunnitelmien dokumentointia | 2h |
| 13.11 | Käyttötapausten suunnittelua | 1h |
| 14.11 | Mockupin tekoa | 3h |
| 14.11 | Käyttötapausten tekoa | 1h |
| 16.11 | Käyttöliittymän koodaamista | 4h |
| 21.11 | Käyttöliittymän koodaamista | 3h |
| 22.11 | Käyttöliittymän koodaamista | 6h |
| 26.11 | Pääfunktioiden koodaamista | 5h |
| 27.11 | Koodaamista ja ihmettelyä | 6h |
| 28.11 | Kuuntelumoodi valmiiksi | 4h |
| 29.11 | Kirjoitusmoodi valmiiksi | 6h |
| 3.12 | Vapaamoodi valmiiksi | 4h |
| 3-4.12 | Äänen kanssa painimista | 5h |
| 4.12 | Menun käyttöliittymä, äänen säätöä | 3h |
| 5.12 | Custom sanalista, viimeistelyä, **appi käytännössä valmis** | 7h |

## Itsearviointi

Tavoitteena oli luoda ehdotuksen mukainen sovellus neljässä viikossa, tarkemmat tavoitteet listattuna projektin Wikissä. Tavoitteisiin päästiin (itselle ainakin hieman yllättäen) enemmän tai vähemmän aikataulun mukaisesti. Ajankäytön kannalta projekti ehti valmiiksi 5.12. vain muutama päivä ennen seminaaria, eli aikaa on tullut käytettyä lähes päivälleen sen verrain kuin olin sitä tämän projektin työstämiseen varannut (suunnitelman arviot hieman yläkanttiin).

Suurimpana haasteena oli ehkä äänen lisääminen sovellukseen. Ongelmana on että äänen pitää olla jatkuvaa, jolloin äänen pitää mm. loopata täydellisesti ilman napsahduksia tai muita outouksia. Aiemmin tekemäni [morse websovellus](http://142.93.140.110/telegram/) loi oskillaattorin, joka loi tasaista siniaaltoa (tämä ratkaisu ei ole oma), joka mahdollisti erittäin puhtaan jatkuvan äänen, jota ei tarvinnut erikseen loopata. Tätä ratkaisua ei mobiilisovelluksessa voinut hyödyntää ainakaan sellaisenaan, vaan oli lopulta pakko vain käyttää ihan tavallista loopattua äänitiedostoa, johon sopivan kirjaston löytäminen oli jo oma haasteensa. Lopputuloksena on ääni joka napsuu inhottavasti aina alkaessaan ja loppuessaan, mutta tämä on kuitenkin sovelluksen toiminnan kannalta OK.  

Suurimpana epäkohtana on ehkä itse koodin sotkuisuus. En ole välttämättä ihan täysin hyödyntänyt Reactin ominaisuuksia parhaalla mahdollisella tavalla ja osa koodista toistuu laiskasti eri näkymissä, sen sijaan että olisi esim. erikseen omassa tiedostossaan. Lopputulos on toimiva ja tismalleen suunnitelman mukainen, mutta koodin kannalta ei ainakaan omasta mielestä kovin nätti.

Arvosanaehdotuksena antaisin ehkä **3/5**.