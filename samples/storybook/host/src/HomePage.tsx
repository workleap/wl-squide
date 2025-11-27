import { useEnvironmentVariables } from "@squide/firefly";
import { useSuspenseQuery } from "@tanstack/react-query";

interface Character {
    id: number;
    name: string;
    species: string;
}

export function HomePage() {
    const environmentVariables = useEnvironmentVariables();

    const { data: characters } = useSuspenseQuery({ queryKey: [`${environmentVariables.hostApiBaseUrl}/character/1,2`], queryFn: async () => {
        const response = await fetch(`${environmentVariables.hostApiBaseUrl}/character/1,2`);

        if (!response.ok) {
            throw new Error("Cannot fetch the characters!");
        }

        return response.json() as unknown as Character[];
    } });

    return (
        <div>
            <h2>Home</h2>
            <div>
                {characters.map(x => {
                    return (
                        <div key={x.id}>
                            <span>Id: {x.id}</span>
                            <span> - </span>
                            <span>Name: {x.name}</span>
                            <span> - </span>
                            <span>Species: {x.species}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
