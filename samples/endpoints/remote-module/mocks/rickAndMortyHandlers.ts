import { EnvironmentVariables } from "@squide/firefly";
import { HttpResponse, http, type HttpHandler } from "msw";
import { sessionAccessor } from "./session.ts";

// Must specify the return type, otherwise we get a TS2742: The inferred type cannot be named without a reference to X. This is likely not portable.
// A type annotation is necessary.
export function getRickAndMortyHandlers(environmentVariables: EnvironmentVariables): HttpHandler[] {
    return [
        http.get(`${environmentVariables.rickAndMortyApiBaseUrl}episode/1,2`, () => {
            const session = sessionAccessor.getSession();

            if (!session) {
                return new HttpResponse(null, {
                    status: 401
                });
            }

            const isEn = session.preferredLanguage === "en-US";

            return HttpResponse.json([{
                "id": 1,
                "name": isEn ? "Pilot" : "Pilote",
                "air_date": isEn ? "December 2, 2013" : "2 décembre 2013",
                "episode": "S01E01",
                "characters": ["https://rickandmortyapi.com/api/character/1", "https://rickandmortyapi.com/api/character/2", "https://rickandmortyapi.com/api/character/35", "https://rickandmortyapi.com/api/character/38", "https://rickandmortyapi.com/api/character/62", "https://rickandmortyapi.com/api/character/92", "https://rickandmortyapi.com/api/character/127", "https://rickandmortyapi.com/api/character/144", "https://rickandmortyapi.com/api/character/158", "https://rickandmortyapi.com/api/character/175", "https://rickandmortyapi.com/api/character/179", "https://rickandmortyapi.com/api/character/181", "https://rickandmortyapi.com/api/character/239", "https://rickandmortyapi.com/api/character/249", "https://rickandmortyapi.com/api/character/271", "https://rickandmortyapi.com/api/character/338", "https://rickandmortyapi.com/api/character/394", "https://rickandmortyapi.com/api/character/395", "https://rickandmortyapi.com/api/character/435"],
                "url": "https://rickandmortyapi.com/api/episode/1",
                "created": "2017-11-10T12:56:33.798Z"
            }, {
                "id": 2,
                "name": isEn ? "Lawnmower Dog" : "Chien tondeuse à gazon",
                "air_date": isEn ? "December 9, 2013" : "9 décembre 2013",
                "episode": "S01E02",
                "characters": ["https://rickandmortyapi.com/api/character/1", "https://rickandmortyapi.com/api/character/2", "https://rickandmortyapi.com/api/character/38", "https://rickandmortyapi.com/api/character/46", "https://rickandmortyapi.com/api/character/63", "https://rickandmortyapi.com/api/character/80", "https://rickandmortyapi.com/api/character/175", "https://rickandmortyapi.com/api/character/221", "https://rickandmortyapi.com/api/character/239", "https://rickandmortyapi.com/api/character/246", "https://rickandmortyapi.com/api/character/304", "https://rickandmortyapi.com/api/character/305", "https://rickandmortyapi.com/api/character/306", "https://rickandmortyapi.com/api/character/329", "https://rickandmortyapi.com/api/character/338", "https://rickandmortyapi.com/api/character/396", "https://rickandmortyapi.com/api/character/397", "https://rickandmortyapi.com/api/character/398", "https://rickandmortyapi.com/api/character/405"],
                "url": "https://rickandmortyapi.com/api/episode/2",
                "created": "2017-11-10T12:56:33.916Z"
            }]);
        }),

        http.get(`${environmentVariables.rickAndMortyApiBaseUrl}location/1,2,3`, () => {
            const session = sessionAccessor.getSession();

            if (!session) {
                return new HttpResponse(null, {
                    status: 401
                });
            }

            const isEn = session.preferredLanguage === "en-US";

            return HttpResponse.json([{
                "id": 1,
                "name": isEn ? "Earth (C-137)" : "La Terre (C-137)",
                "type": isEn ? "Planet" : "Planète",
                "dimension": "Dimension C-137",
                "residents": ["https://rickandmortyapi.com/api/character/38", "https://rickandmortyapi.com/api/character/45", "https://rickandmortyapi.com/api/character/71", "https://rickandmortyapi.com/api/character/82", "https://rickandmortyapi.com/api/character/83", "https://rickandmortyapi.com/api/character/92", "https://rickandmortyapi.com/api/character/112", "https://rickandmortyapi.com/api/character/114", "https://rickandmortyapi.com/api/character/116", "https://rickandmortyapi.com/api/character/117", "https://rickandmortyapi.com/api/character/120", "https://rickandmortyapi.com/api/character/127", "https://rickandmortyapi.com/api/character/155", "https://rickandmortyapi.com/api/character/169", "https://rickandmortyapi.com/api/character/175", "https://rickandmortyapi.com/api/character/179", "https://rickandmortyapi.com/api/character/186", "https://rickandmortyapi.com/api/character/201", "https://rickandmortyapi.com/api/character/216", "https://rickandmortyapi.com/api/character/239", "https://rickandmortyapi.com/api/character/271", "https://rickandmortyapi.com/api/character/302", "https://rickandmortyapi.com/api/character/303", "https://rickandmortyapi.com/api/character/338", "https://rickandmortyapi.com/api/character/343", "https://rickandmortyapi.com/api/character/356", "https://rickandmortyapi.com/api/character/394"],
                "url": "https://rickandmortyapi.com/api/location/1",
                "created": "2017-11-10T12:42:04.162Z"
            }, {
                "id": 2,
                "name": "Abadango",
                "type": isEn ? "Cluster" : "Amas",
                "dimension": isEn ? "unknown" : "inconnue",
                "residents": ["https://rickandmortyapi.com/api/character/6"],
                "url": "https://rickandmortyapi.com/api/location/2",
                "created": "2017-11-10T13:06:38.182Z"
            }, {
                "id": 3,
                "name": isEn ? "Citadel of Ricks" : "La citadèle de Ricks",
                "type": isEn ? "Space station" : "Station spaciale",
                "dimension": isEn ? "unknown" : "inconnue",
                "residents": ["https://rickandmortyapi.com/api/character/8", "https://rickandmortyapi.com/api/character/14", "https://rickandmortyapi.com/api/character/15", "https://rickandmortyapi.com/api/character/18", "https://rickandmortyapi.com/api/character/21", "https://rickandmortyapi.com/api/character/22", "https://rickandmortyapi.com/api/character/27", "https://rickandmortyapi.com/api/character/42", "https://rickandmortyapi.com/api/character/43", "https://rickandmortyapi.com/api/character/44", "https://rickandmortyapi.com/api/character/48", "https://rickandmortyapi.com/api/character/53", "https://rickandmortyapi.com/api/character/56", "https://rickandmortyapi.com/api/character/61", "https://rickandmortyapi.com/api/character/69", "https://rickandmortyapi.com/api/character/72", "https://rickandmortyapi.com/api/character/73", "https://rickandmortyapi.com/api/character/74", "https://rickandmortyapi.com/api/character/77", "https://rickandmortyapi.com/api/character/78", "https://rickandmortyapi.com/api/character/85", "https://rickandmortyapi.com/api/character/86", "https://rickandmortyapi.com/api/character/95", "https://rickandmortyapi.com/api/character/118", "https://rickandmortyapi.com/api/character/119", "https://rickandmortyapi.com/api/character/123", "https://rickandmortyapi.com/api/character/135", "https://rickandmortyapi.com/api/character/143", "https://rickandmortyapi.com/api/character/152", "https://rickandmortyapi.com/api/character/164", "https://rickandmortyapi.com/api/character/165", "https://rickandmortyapi.com/api/character/187", "https://rickandmortyapi.com/api/character/200", "https://rickandmortyapi.com/api/character/206", "https://rickandmortyapi.com/api/character/209", "https://rickandmortyapi.com/api/character/220", "https://rickandmortyapi.com/api/character/229", "https://rickandmortyapi.com/api/character/231", "https://rickandmortyapi.com/api/character/235", "https://rickandmortyapi.com/api/character/267", "https://rickandmortyapi.com/api/character/278", "https://rickandmortyapi.com/api/character/281", "https://rickandmortyapi.com/api/character/283", "https://rickandmortyapi.com/api/character/284", "https://rickandmortyapi.com/api/character/285", "https://rickandmortyapi.com/api/character/286", "https://rickandmortyapi.com/api/character/287", "https://rickandmortyapi.com/api/character/288", "https://rickandmortyapi.com/api/character/289", "https://rickandmortyapi.com/api/character/291", "https://rickandmortyapi.com/api/character/295", "https://rickandmortyapi.com/api/character/298", "https://rickandmortyapi.com/api/character/299", "https://rickandmortyapi.com/api/character/322", "https://rickandmortyapi.com/api/character/325", "https://rickandmortyapi.com/api/character/328", "https://rickandmortyapi.com/api/character/330", "https://rickandmortyapi.com/api/character/345", "https://rickandmortyapi.com/api/character/359", "https://rickandmortyapi.com/api/character/366", "https://rickandmortyapi.com/api/character/378", "https://rickandmortyapi.com/api/character/385", "https://rickandmortyapi.com/api/character/392", "https://rickandmortyapi.com/api/character/461", "https://rickandmortyapi.com/api/character/462", "https://rickandmortyapi.com/api/character/463", "https://rickandmortyapi.com/api/character/464", "https://rickandmortyapi.com/api/character/465", "https://rickandmortyapi.com/api/character/466", "https://rickandmortyapi.com/api/character/472", "https://rickandmortyapi.com/api/character/473", "https://rickandmortyapi.com/api/character/474", "https://rickandmortyapi.com/api/character/475", "https://rickandmortyapi.com/api/character/476", "https://rickandmortyapi.com/api/character/477", "https://rickandmortyapi.com/api/character/478", "https://rickandmortyapi.com/api/character/479", "https://rickandmortyapi.com/api/character/480", "https://rickandmortyapi.com/api/character/481", "https://rickandmortyapi.com/api/character/482", "https://rickandmortyapi.com/api/character/483", "https://rickandmortyapi.com/api/character/484", "https://rickandmortyapi.com/api/character/485", "https://rickandmortyapi.com/api/character/486", "https://rickandmortyapi.com/api/character/487", "https://rickandmortyapi.com/api/character/488", "https://rickandmortyapi.com/api/character/489", "https://rickandmortyapi.com/api/character/2", "https://rickandmortyapi.com/api/character/1", "https://rickandmortyapi.com/api/character/801", "https://rickandmortyapi.com/api/character/802", "https://rickandmortyapi.com/api/character/803", "https://rickandmortyapi.com/api/character/804", "https://rickandmortyapi.com/api/character/805", "https://rickandmortyapi.com/api/character/806", "https://rickandmortyapi.com/api/character/810", "https://rickandmortyapi.com/api/character/811", "https://rickandmortyapi.com/api/character/812", "https://rickandmortyapi.com/api/character/819", "https://rickandmortyapi.com/api/character/820", "https://rickandmortyapi.com/api/character/818"],
                "url": "https://rickandmortyapi.com/api/location/3",
                "created": "2017-11-10T13:08:13.191Z"
            }]);
        }),

        http.get(`${environmentVariables.rickAndMortyApiBaseUrl}location/failing`, () => {
            return new HttpResponse(null, {
                status: 500
            });
        })
    ];
}
