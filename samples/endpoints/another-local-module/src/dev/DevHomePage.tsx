import { useEffect, useState } from "react";

export function DevHomePage() {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const id = setInterval(() => {
            setCount(x => x + 1);
        }, 1000);

        return () => {
            clearInterval(id);
        };
    }, []);

    return (
        <div>
            <h2>Another local module development home page</h2>
            <p>Hey!</p>
            <p>{count}</p>
        </div>
    );
}
