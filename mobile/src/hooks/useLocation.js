import { useEffect, useState } from "react";

export function useLocation() {
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        async function loadLocation() {
            setLoading(true);
            try {
                if (!isMounted) {
                    return;
                }

                setLocation(null);
            } catch (err) {
                if (isMounted) {
                    setError(err);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        loadLocation();

        return () => {
            isMounted = false;
        };
    }, []);

    return { location, loading, error };
}
