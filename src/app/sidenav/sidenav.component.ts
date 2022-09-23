import {Component} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { QueryHandlerService } from '../_services/query-handler.service';

/** @title Responsive sidenav */
@Component({
  selector: 'app-sidenav',
  templateUrl: 'sidenav.component.html',
  styleUrls: ['sidenav.component.css'],
})

export class SidenavComponent {
    options: FormGroup;

    fakeData = [{
      "id": 1,
      "firstName": "Nert",
      "lastName": "Wavish",
      "affiliation": "Trilia",
      "email": "nwavish0@cmu.edu",
      "reason": "consequat in consequat ut nulla sed accumsan felis ut at dolor quis odio",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 2,
      "firstName": "Heywood",
      "lastName": "O'Feeny",
      "affiliation": "Wikivu",
      "email": "hofeeny1@whitehouse.gov",
      "reason": "etiam faucibus cursus urna ut tellus nulla ut erat id mauris vulputate elementum nullam",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 3,
      "firstName": "Linnet",
      "lastName": "Witchard",
      "affiliation": "Fadeo",
      "email": "lwitchard2@clickbank.net",
      "reason": "hac habitasse platea dictumst morbi vestibulum velit id pretium iaculis diam erat fermentum justo nec condimentum neque sapien",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 4,
      "firstName": "Horacio",
      "lastName": "Windebank",
      "affiliation": "Yata",
      "email": "hwindebank3@java.com",
      "reason": "nisi nam ultrices libero non mattis pulvinar nulla pede ullamcorper augue a",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 5,
      "firstName": "Tiena",
      "lastName": "Dayment",
      "affiliation": "Skiba",
      "email": "tdayment4@mapquest.com",
      "reason": "mi in porttitor pede justo eu massa donec dapibus duis at velit eu est congue",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 6,
      "firstName": "Marianna",
      "lastName": "Attawell",
      "affiliation": "Blogpad",
      "email": "mattawell5@multiply.com",
      "reason": "risus praesent lectus vestibulum quam sapien varius ut blandit non interdum in ante vestibulum",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 7,
      "firstName": "Owen",
      "lastName": "Balwin",
      "affiliation": "Plambee",
      "email": "obalwin6@reference.com",
      "reason": "vivamus vestibulum sagittis sapien cum sociis natoque penatibus et magnis dis parturient montes nascetur ridiculus mus etiam vel",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 8,
      "firstName": "Wendell",
      "lastName": "Langmaid",
      "affiliation": "Zoovu",
      "email": "wlangmaid7@geocities.com",
      "reason": "nunc viverra dapibus nulla suscipit ligula in lacus curabitur at ipsum ac",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 9,
      "firstName": "Christy",
      "lastName": "Elvy",
      "affiliation": "Jabbertype",
      "email": "celvy8@aol.com",
      "reason": "nulla nisl nunc nisl duis bibendum felis sed interdum venenatis turpis enim blandit mi in porttitor pede justo eu",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 10,
      "firstName": "Mordy",
      "lastName": "Crepin",
      "affiliation": "Tazzy",
      "email": "mcrepin9@yandex.ru",
      "reason": "lectus in est risus auctor sed tristique in tempus sit amet sem fusce consequat nulla nisl nunc nisl duis",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 11,
      "firstName": "Lyle",
      "lastName": "Thickin",
      "affiliation": "Yakijo",
      "email": "lthickina@cbslocal.com",
      "reason": "id consequat in consequat ut nulla sed accumsan felis ut at dolor quis odio consequat varius integer",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 12,
      "firstName": "Bernelle",
      "lastName": "Boughen",
      "affiliation": "JumpXS",
      "email": "bboughenb@sbwire.com",
      "reason": "convallis nunc proin at turpis a pede posuere nonummy integer non",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 13,
      "firstName": "Bamby",
      "lastName": "Rendell",
      "affiliation": "Zazio",
      "email": "brendellc@t-online.de",
      "reason": "sapien iaculis congue vivamus metus arcu adipiscing molestie hendrerit at vulputate vitae nisl aenean lectus pellentesque eget nunc donec",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 14,
      "firstName": "Caroline",
      "lastName": "Gilluley",
      "affiliation": "Realbuzz",
      "email": "cgilluleyd@geocities.com",
      "reason": "sed magna at nunc commodo placerat praesent blandit nam nulla integer pede justo",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 15,
      "firstName": "Celestyna",
      "lastName": "Vasyanin",
      "affiliation": "Rhyzio",
      "email": "cvasyanine@yellowbook.com",
      "reason": "in faucibus orci luctus et ultrices posuere cubilia curae nulla dapibus dolor vel est donec odio justo",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 16,
      "firstName": "Tad",
      "lastName": "Stolte",
      "affiliation": "Janyx",
      "email": "tstoltef@cbc.ca",
      "reason": "lacinia nisi venenatis tristique fusce congue diam id ornare imperdiet sapien urna pretium nisl ut volutpat sapien arcu sed",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 17,
      "firstName": "Perri",
      "lastName": "France",
      "affiliation": "Jaxbean",
      "email": "pfranceg@indiatimes.com",
      "reason": "felis donec semper sapien a libero nam dui proin leo odio porttitor id consequat in",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 18,
      "firstName": "Pearce",
      "lastName": "Arnault",
      "affiliation": "JumpXS",
      "email": "parnaulth@nsw.gov.au",
      "reason": "massa id lobortis convallis tortor risus dapibus augue vel accumsan tellus nisi eu orci mauris lacinia sapien quis",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 19,
      "firstName": "Cassaundra",
      "lastName": "Heild",
      "affiliation": "Tagcat",
      "email": "cheildi@skype.com",
      "reason": "dapibus augue vel accumsan tellus nisi eu orci mauris lacinia sapien quis libero nullam sit amet turpis elementum ligula",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 20,
      "firstName": "Othella",
      "lastName": "Benasik",
      "affiliation": "Flipbug",
      "email": "obenasikj@newsvine.com",
      "reason": "vitae nisi nam ultrices libero non mattis pulvinar nulla pede",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 21,
      "firstName": "Lamar",
      "lastName": "Kleimt",
      "affiliation": "Jatri",
      "email": "lkleimtk@blogger.com",
      "reason": "ut suscipit a feugiat et eros vestibulum ac est lacinia nisi venenatis tristique fusce congue diam id ornare",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 22,
      "firstName": "Donielle",
      "lastName": "Cluitt",
      "affiliation": "Jaxspan",
      "email": "dcluittl@goodreads.com",
      "reason": "sit amet eros suspendisse accumsan tortor quis turpis sed ante vivamus tortor duis mattis egestas metus aenean fermentum donec",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 23,
      "firstName": "Reeva",
      "lastName": "Geraudy",
      "affiliation": "Gabvine",
      "email": "rgeraudym@etsy.com",
      "reason": "dui nec nisi volutpat eleifend donec ut dolor morbi vel lectus in quam fringilla",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 24,
      "firstName": "Juliet",
      "lastName": "Impy",
      "affiliation": "Thoughtworks",
      "email": "jimpyn@census.gov",
      "reason": "consequat morbi a ipsum integer a nibh in quis justo maecenas rhoncus aliquam lacus morbi quis tortor",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 25,
      "firstName": "Pammi",
      "lastName": "Pedlingham",
      "affiliation": "Topdrive",
      "email": "ppedlinghamo@cornell.edu",
      "reason": "convallis tortor risus dapibus augue vel accumsan tellus nisi eu orci mauris lacinia sapien quis libero nullam",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 26,
      "firstName": "Rafael",
      "lastName": "Plessing",
      "affiliation": "Brainverse",
      "email": "rplessingp@army.mil",
      "reason": "eu est congue elementum in hac habitasse platea dictumst morbi vestibulum velit id",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 27,
      "firstName": "Barbara",
      "lastName": "Woolway",
      "affiliation": "Jabbersphere",
      "email": "bwoolwayq@thetimes.co.uk",
      "reason": "turpis eget elit sodales scelerisque mauris sit amet eros suspendisse accumsan tortor quis turpis",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 28,
      "firstName": "Rae",
      "lastName": "Rockwill",
      "affiliation": "Cogidoo",
      "email": "rrockwillr@csmonitor.com",
      "reason": "egestas metus aenean fermentum donec ut mauris eget massa tempor convallis nulla",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 29,
      "firstName": "Sena",
      "lastName": "Bambury",
      "affiliation": "Wikido",
      "email": "sbamburys@constantcontact.com",
      "reason": "sed augue aliquam erat volutpat in congue etiam justo etiam pretium iaculis justo in hac habitasse platea dictumst",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 30,
      "firstName": "Otes",
      "lastName": "Sawley",
      "affiliation": "Thoughtblab",
      "email": "osawleyt@omniture.com",
      "reason": "nisi vulputate nonummy maecenas tincidunt lacus at velit vivamus vel",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 31,
      "firstName": "Shani",
      "lastName": "Polin",
      "affiliation": "Quatz",
      "email": "spolinu@amazon.co.uk",
      "reason": "aliquam convallis nunc proin at turpis a pede posuere nonummy integer non velit donec diam neque",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 32,
      "firstName": "Adolphe",
      "lastName": "Caveau",
      "affiliation": "Jayo",
      "email": "acaveauv@cocolog-nifty.com",
      "reason": "molestie lorem quisque ut erat curabitur gravida nisi at nibh in hac",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 33,
      "firstName": "Ode",
      "lastName": "Siddele",
      "affiliation": "Yakidoo",
      "email": "osiddelew@wp.com",
      "reason": "mauris non ligula pellentesque ultrices phasellus id sapien in sapien iaculis congue vivamus metus arcu adipiscing",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 34,
      "firstName": "Derek",
      "lastName": "Keegan",
      "affiliation": "Kazu",
      "email": "dkeeganx@amazon.co.jp",
      "reason": "vivamus tortor duis mattis egestas metus aenean fermentum donec ut",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 35,
      "firstName": "Maxie",
      "lastName": "Greiswood",
      "affiliation": "Realbuzz",
      "email": "mgreiswoody@smh.com.au",
      "reason": "ultrices posuere cubilia curae mauris viverra diam vitae quam suspendisse potenti nullam porttitor lacus",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 36,
      "firstName": "Oralla",
      "lastName": "Baterip",
      "affiliation": "Trilia",
      "email": "obateripz@gravatar.com",
      "reason": "faucibus orci luctus et ultrices posuere cubilia curae nulla dapibus dolor vel est donec odio justo sollicitudin ut",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 37,
      "firstName": "Rowan",
      "lastName": "Behrend",
      "affiliation": "Riffpath",
      "email": "rbehrend10@mapy.cz",
      "reason": "sed vestibulum sit amet cursus id turpis integer aliquet massa id lobortis",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 38,
      "firstName": "Darcie",
      "lastName": "Geck",
      "affiliation": "Skynoodle",
      "email": "dgeck11@wordpress.com",
      "reason": "neque sapien placerat ante nulla justo aliquam quis turpis eget elit sodales",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 39,
      "firstName": "Ianthe",
      "lastName": "Luparti",
      "affiliation": "Jetwire",
      "email": "iluparti12@army.mil",
      "reason": "morbi non lectus aliquam sit amet diam in magna bibendum imperdiet nullam orci pede venenatis non sodales sed",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 40,
      "firstName": "Weber",
      "lastName": "Zanetti",
      "affiliation": "Skinix",
      "email": "wzanetti13@jalbum.net",
      "reason": "consequat nulla nisl nunc nisl duis bibendum felis sed interdum venenatis turpis enim blandit mi",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 41,
      "firstName": "Dorian",
      "lastName": "Mathe",
      "affiliation": "Pixoboo",
      "email": "dmathe14@liveinternet.ru",
      "reason": "eu nibh quisque id justo sit amet sapien dignissim vestibulum vestibulum ante ipsum primis in faucibus orci luctus",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 42,
      "firstName": "Jeri",
      "lastName": "Angier",
      "affiliation": "Twitterbridge",
      "email": "jangier15@usatoday.com",
      "reason": "ut blandit non interdum in ante vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 43,
      "firstName": "Tess",
      "lastName": "Shillabeer",
      "affiliation": "Rhynoodle",
      "email": "tshillabeer16@nps.gov",
      "reason": "in tempus sit amet sem fusce consequat nulla nisl nunc nisl duis bibendum felis sed interdum",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 44,
      "firstName": "Britt",
      "lastName": "Dunkinson",
      "affiliation": "Eare",
      "email": "bdunkinson17@xing.com",
      "reason": "fringilla rhoncus mauris enim leo rhoncus sed vestibulum sit amet cursus id turpis integer aliquet",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 45,
      "firstName": "Aguie",
      "lastName": "Seifenmacher",
      "affiliation": "Jabbersphere",
      "email": "aseifenmacher18@techcrunch.com",
      "reason": "suspendisse potenti cras in purus eu magna vulputate luctus cum sociis natoque penatibus",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 46,
      "firstName": "Carmelita",
      "lastName": "Bockin",
      "affiliation": "Browsetype",
      "email": "cbockin19@usa.gov",
      "reason": "pellentesque quisque porta volutpat erat quisque erat eros viverra eget congue eget semper rutrum nulla nunc purus phasellus",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 47,
      "firstName": "Mandel",
      "lastName": "Rawsthorne",
      "affiliation": "Viva",
      "email": "mrawsthorne1a@indiegogo.com",
      "reason": "ultrices posuere cubilia curae nulla dapibus dolor vel est donec odio justo sollicitudin ut suscipit a feugiat et eros vestibulum",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 48,
      "firstName": "Dionysus",
      "lastName": "Tersay",
      "affiliation": "Rooxo",
      "email": "dtersay1b@gizmodo.com",
      "reason": "ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae duis faucibus accumsan odio",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 49,
      "firstName": "Suki",
      "lastName": "Paulat",
      "affiliation": "Photofeed",
      "email": "spaulat1c@intel.com",
      "reason": "nullam molestie nibh in lectus pellentesque at nulla suspendisse potenti cras in purus eu magna vulputate luctus cum sociis natoque",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 50,
      "firstName": "Aleksandr",
      "lastName": "Golsby",
      "affiliation": "Wikibox",
      "email": "agolsby1d@qq.com",
      "reason": "morbi ut odio cras mi pede malesuada in imperdiet et commodo vulputate justo in",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 51,
      "firstName": "Paige",
      "lastName": "Hanburry",
      "affiliation": "Gigazoom",
      "email": "phanburry1e@va.gov",
      "reason": "nisl ut volutpat sapien arcu sed augue aliquam erat volutpat in congue etiam justo etiam pretium iaculis justo in",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 52,
      "firstName": "Denver",
      "lastName": "Demogeot",
      "affiliation": "Yodel",
      "email": "ddemogeot1f@skyrock.com",
      "reason": "consequat metus sapien ut nunc vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 53,
      "firstName": "Ashleigh",
      "lastName": "Attfield",
      "affiliation": "Photojam",
      "email": "aattfield1g@google.ca",
      "reason": "at turpis donec posuere metus vitae ipsum aliquam non mauris morbi non lectus aliquam sit amet",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 54,
      "firstName": "Maje",
      "lastName": "Phillippo",
      "affiliation": "Skyble",
      "email": "mphillippo1h@independent.co.uk",
      "reason": "hac habitasse platea dictumst maecenas ut massa quis augue luctus tincidunt",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 55,
      "firstName": "Faye",
      "lastName": "Polden",
      "affiliation": "Photospace",
      "email": "fpolden1i@woothemes.com",
      "reason": "ut nunc vestibulum ante ipsum primis in faucibus orci luctus et",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 56,
      "firstName": "Gan",
      "lastName": "Dearsley",
      "affiliation": "Camimbo",
      "email": "gdearsley1j@telegraph.co.uk",
      "reason": "tincidunt ante vel ipsum praesent blandit lacinia erat vestibulum sed magna at nunc commodo placerat praesent blandit nam",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 57,
      "firstName": "Nancey",
      "lastName": "Boc",
      "affiliation": "Jatri",
      "email": "nboc1k@rambler.ru",
      "reason": "varius nulla facilisi cras non velit nec nisi vulputate nonummy maecenas",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 58,
      "firstName": "Barclay",
      "lastName": "Tassell",
      "affiliation": "Realcube",
      "email": "btassell1l@dailymotion.com",
      "reason": "eget rutrum at lorem integer tincidunt ante vel ipsum praesent blandit lacinia erat vestibulum sed magna at nunc",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 59,
      "firstName": "Juanita",
      "lastName": "Jan",
      "affiliation": "Ozu",
      "email": "jjan1m@yandex.ru",
      "reason": "laoreet ut rhoncus aliquet pulvinar sed nisl nunc rhoncus dui vel sem sed sagittis nam congue risus semper porta",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 60,
      "firstName": "Ada",
      "lastName": "Mordy",
      "affiliation": "Twinte",
      "email": "amordy1n@ehow.com",
      "reason": "augue vestibulum rutrum rutrum neque aenean auctor gravida sem praesent id massa id nisl venenatis lacinia aenean",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 61,
      "firstName": "Bennie",
      "lastName": "Szubert",
      "affiliation": "Voomm",
      "email": "bszubert1o@seesaa.net",
      "reason": "lobortis ligula sit amet eleifend pede libero quis orci nullam molestie nibh in lectus pellentesque at",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 62,
      "firstName": "Jarrid",
      "lastName": "Crosi",
      "affiliation": "Dynabox",
      "email": "jcrosi1p@japanpost.jp",
      "reason": "in blandit ultrices enim lorem ipsum dolor sit amet consectetuer adipiscing elit proin interdum mauris",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 63,
      "firstName": "Nissa",
      "lastName": "Pitcock",
      "affiliation": "Skimia",
      "email": "npitcock1q@soundcloud.com",
      "reason": "ligula pellentesque ultrices phasellus id sapien in sapien iaculis congue vivamus metus arcu adipiscing",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 64,
      "firstName": "Rebbecca",
      "lastName": "Hissie",
      "affiliation": "Devcast",
      "email": "rhissie1r@tripod.com",
      "reason": "metus vitae ipsum aliquam non mauris morbi non lectus aliquam sit amet diam",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 65,
      "firstName": "Cayla",
      "lastName": "Clayton",
      "affiliation": "Twitterwire",
      "email": "cclayton1s@mlb.com",
      "reason": "mauris laoreet ut rhoncus aliquet pulvinar sed nisl nunc rhoncus dui vel sem sed sagittis nam",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 66,
      "firstName": "Alane",
      "lastName": "Dowbakin",
      "affiliation": "Browsecat",
      "email": "adowbakin1t@tinyurl.com",
      "reason": "ultrices posuere cubilia curae duis faucibus accumsan odio curabitur convallis duis consequat dui nec nisi volutpat eleifend donec",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 67,
      "firstName": "Shelia",
      "lastName": "Froude",
      "affiliation": "Yamia",
      "email": "sfroude1u@hp.com",
      "reason": "sed augue aliquam erat volutpat in congue etiam justo etiam pretium",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 68,
      "firstName": "Augustine",
      "lastName": "Morat",
      "affiliation": "Vitz",
      "email": "amorat1v@youtu.be",
      "reason": "est et tempus semper est quam pharetra magna ac consequat metus sapien ut nunc vestibulum ante ipsum primis in",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 69,
      "firstName": "Meggy",
      "lastName": "Woodroofe",
      "affiliation": "Nlounge",
      "email": "mwoodroofe1w@cornell.edu",
      "reason": "ultrices libero non mattis pulvinar nulla pede ullamcorper augue a suscipit nulla elit ac nulla sed",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 70,
      "firstName": "Cody",
      "lastName": "Brumfitt",
      "affiliation": "Blogpad",
      "email": "cbrumfitt1x@marketwatch.com",
      "reason": "velit vivamus vel nulla eget eros elementum pellentesque quisque porta volutpat erat quisque erat eros",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 71,
      "firstName": "Arlan",
      "lastName": "Binnall",
      "affiliation": "Tekfly",
      "email": "abinnall1y@jiathis.com",
      "reason": "rhoncus sed vestibulum sit amet cursus id turpis integer aliquet",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 72,
      "firstName": "Dalt",
      "lastName": "Bloys",
      "affiliation": "Roodel",
      "email": "dbloys1z@live.com",
      "reason": "bibendum felis sed interdum venenatis turpis enim blandit mi in porttitor pede justo eu massa donec dapibus duis at velit",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 73,
      "firstName": "Lexie",
      "lastName": "Elphey",
      "affiliation": "Youspan",
      "email": "lelphey20@is.gd",
      "reason": "nisl duis ac nibh fusce lacus purus aliquet at feugiat non pretium quis lectus suspendisse potenti",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 74,
      "firstName": "Dougy",
      "lastName": "Rothman",
      "affiliation": "Myworks",
      "email": "drothman21@netvibes.com",
      "reason": "eget eleifend luctus ultricies eu nibh quisque id justo sit amet sapien dignissim vestibulum vestibulum ante",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 75,
      "firstName": "Jenica",
      "lastName": "Egginson",
      "affiliation": "Flipopia",
      "email": "jegginson22@pcworld.com",
      "reason": "neque aenean auctor gravida sem praesent id massa id nisl venenatis lacinia aenean sit amet justo morbi ut",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 76,
      "firstName": "Leigh",
      "lastName": "Ricardon",
      "affiliation": "Voolia",
      "email": "lricardon23@artisteer.com",
      "reason": "amet nulla quisque arcu libero rutrum ac lobortis vel dapibus",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 77,
      "firstName": "Steffie",
      "lastName": "Frewer",
      "affiliation": "Flipopia",
      "email": "sfrewer24@quantcast.com",
      "reason": "vestibulum ac est lacinia nisi venenatis tristique fusce congue diam id ornare imperdiet",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 78,
      "firstName": "Cosette",
      "lastName": "Gounel",
      "affiliation": "Oyope",
      "email": "cgounel25@jiathis.com",
      "reason": "morbi porttitor lorem id ligula suspendisse ornare consequat lectus in est risus auctor sed tristique in tempus sit amet sem",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 79,
      "firstName": "Fransisco",
      "lastName": "Corbin",
      "affiliation": "Oyope",
      "email": "fcorbin26@sohu.com",
      "reason": "nam nulla integer pede justo lacinia eget tincidunt eget tempus vel pede morbi porttitor",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 80,
      "firstName": "Robin",
      "lastName": "Alyonov",
      "affiliation": "Brightdog",
      "email": "ralyonov27@msu.edu",
      "reason": "sapien cursus vestibulum proin eu mi nulla ac enim in tempor turpis nec euismod scelerisque quam turpis adipiscing lorem",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 81,
      "firstName": "Budd",
      "lastName": "Broadbere",
      "affiliation": "Omba",
      "email": "bbroadbere28@cloudflare.com",
      "reason": "nibh in hac habitasse platea dictumst aliquam augue quam sollicitudin vitae consectetuer eget rutrum at",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 82,
      "firstName": "Garvy",
      "lastName": "Acey",
      "affiliation": "Yakitri",
      "email": "gacey29@freewebs.com",
      "reason": "duis consequat dui nec nisi volutpat eleifend donec ut dolor morbi vel lectus in",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 83,
      "firstName": "Kissee",
      "lastName": "Lerigo",
      "affiliation": "Feedfire",
      "email": "klerigo2a@drupal.org",
      "reason": "ridiculus mus etiam vel augue vestibulum rutrum rutrum neque aenean auctor gravida sem praesent id massa id nisl",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 84,
      "firstName": "Sofia",
      "lastName": "Beeckx",
      "affiliation": "Skipstorm",
      "email": "sbeeckx2b@usa.gov",
      "reason": "ultrices enim lorem ipsum dolor sit amet consectetuer adipiscing elit proin interdum",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 85,
      "firstName": "Jodie",
      "lastName": "Mebius",
      "affiliation": "Janyx",
      "email": "jmebius2c@devhub.com",
      "reason": "ante vivamus tortor duis mattis egestas metus aenean fermentum donec ut mauris eget",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 86,
      "firstName": "Lulu",
      "lastName": "Cersey",
      "affiliation": "Kamba",
      "email": "lcersey2d@nydailynews.com",
      "reason": "etiam vel augue vestibulum rutrum rutrum neque aenean auctor gravida sem praesent",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 87,
      "firstName": "Enid",
      "lastName": "Boole",
      "affiliation": "Eidel",
      "email": "eboole2e@mysql.com",
      "reason": "nunc proin at turpis a pede posuere nonummy integer non velit",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 88,
      "firstName": "Fara",
      "lastName": "Petticrow",
      "affiliation": "Aimbu",
      "email": "fpetticrow2f@123-reg.co.uk",
      "reason": "ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae nulla dapibus dolor vel",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 89,
      "firstName": "Niven",
      "lastName": "Chsteney",
      "affiliation": "Mudo",
      "email": "nchsteney2g@nyu.edu",
      "reason": "habitasse platea dictumst aliquam augue quam sollicitudin vitae consectetuer eget rutrum at lorem integer tincidunt ante vel ipsum praesent blandit",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 90,
      "firstName": "Marlene",
      "lastName": "McQuilliam",
      "affiliation": "Brainsphere",
      "email": "mmcquilliam2h@wordpress.com",
      "reason": "semper est quam pharetra magna ac consequat metus sapien ut nunc vestibulum ante ipsum primis in",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 91,
      "firstName": "Land",
      "lastName": "Darton",
      "affiliation": "Meedoo",
      "email": "ldarton2i@vkontakte.ru",
      "reason": "elementum pellentesque quisque porta volutpat erat quisque erat eros viverra eget",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 92,
      "firstName": "Essie",
      "lastName": "Sheehan",
      "affiliation": "Photojam",
      "email": "esheehan2j@over-blog.com",
      "reason": "tempus semper est quam pharetra magna ac consequat metus sapien ut nunc vestibulum ante",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 93,
      "firstName": "Nadine",
      "lastName": "Middlemiss",
      "affiliation": "Meedoo",
      "email": "nmiddlemiss2k@rediff.com",
      "reason": "mi sit amet lobortis sapien sapien non mi integer ac neque duis bibendum morbi non",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 94,
      "firstName": "Hakim",
      "lastName": "Josefer",
      "affiliation": "Miboo",
      "email": "hjosefer2l@multiply.com",
      "reason": "mauris enim leo rhoncus sed vestibulum sit amet cursus id turpis",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 95,
      "firstName": "Brander",
      "lastName": "Nuzzti",
      "affiliation": "Jabbersphere",
      "email": "bnuzzti2m@newyorker.com",
      "reason": "integer ac neque duis bibendum morbi non quam nec dui luctus rutrum nulla tellus in sagittis dui vel",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 96,
      "firstName": "Elaine",
      "lastName": "Klimkin",
      "affiliation": "Mudo",
      "email": "eklimkin2n@fema.gov",
      "reason": "ipsum aliquam non mauris morbi non lectus aliquam sit amet diam",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 97,
      "firstName": "Thayne",
      "lastName": "Grishankov",
      "affiliation": "Trunyx",
      "email": "tgrishankov2o@theglobeandmail.com",
      "reason": "fermentum donec ut mauris eget massa tempor convallis nulla neque libero convallis eget eleifend luctus ultricies eu nibh quisque",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 98,
      "firstName": "Vanda",
      "lastName": "Newis",
      "affiliation": "Fatz",
      "email": "vnewis2p@howstuffworks.com",
      "reason": "in faucibus orci luctus et ultrices posuere cubilia curae mauris viverra diam vitae quam suspendisse potenti nullam porttitor",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 99,
      "firstName": "Maurie",
      "lastName": "Heinrici",
      "affiliation": "Izio",
      "email": "mheinrici2q@vk.com",
      "reason": "lectus in quam fringilla rhoncus mauris enim leo rhoncus sed",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }, {
      "id": 100,
      "firstName": "Cindra",
      "lastName": "Evans",
      "affiliation": "Mudo",
      "email": "cevans2r@npr.org",
      "reason": "et tempus semper est quam pharetra magna ac consequat metus sapien",
      "sampleSpecifications": [
        {
        },
        {
        },
        {
        },
        {
        }
      ],
      "sampleIds": null
    }]
    
    constructor(fb: FormBuilder, private queryHandler: QueryHandlerService, private route: ActivatedRoute,
      private router: Router) {
        this.options = fb.group({
        bottom: 0,
        fixed: true,
        top: 0
        });
    }

    ngAfterViewInit() {
      let recordData: any = this.queryHandler.getAllRecords();
      recordData.getQueryObserver().subscribe((recordData: any) => {
        console.log(recordData.data);
      });
    }

    tempLogout() {
      alert('bypass auth for development')
      localStorage.removeItem('user');
      return this.router.navigate(['/']);
    }
    
}
    