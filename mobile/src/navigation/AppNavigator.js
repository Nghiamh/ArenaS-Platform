import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { setCredentials, setGuestMode } from "../store/slices/authSlice";
import { getItem } from "../utils/storage";
import Loading from "../components/Loading";
import { STORAGE_KEYS } from "../constants/config";

import AuthStack from "./AuthStack";
import MainTab from "./MainTab";

export default function AppNavigator() {
    const dispatch = useDispatch();
    const { token, isGuest } = useSelector((state) => state.auth);
    const [hydrating, setHydrating] = useState(true);

    useEffect(() => {
        let isMounted = true;

        async function hydrateAuth() {
            const storedToken = await getItem(STORAGE_KEYS.authToken);
            const storedGuestMode = await getItem(STORAGE_KEYS.guestMode);

            if (!isMounted) {
                return;
            }

            if (storedToken) {
                dispatch(setCredentials({ token: storedToken }));
            } else if (storedGuestMode === "true") {
                dispatch(setGuestMode());
            }

            setHydrating(false);
        }

        hydrateAuth();

        return () => {
            isMounted = false;
        };
    }, [dispatch]);

    if (hydrating) {
        return <Loading fullScreen />;
    }

    return token || isGuest ? <MainTab /> : <AuthStack />;
}
