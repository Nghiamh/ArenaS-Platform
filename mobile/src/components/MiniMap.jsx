import React, { useRef, useState, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { useSelector } from "react-redux";
import * as Location from 'expo-location';

export default function MiniMap({ sport, onSelectCourt }) {
    const webViewRef = useRef(null);
    const { venues = [] } = useSelector((state) => state.venue);
    const [userLocation, setUserLocation] = useState({ lat: 10.762622, lng: 106.660172 });
    const [isLoadingLoc, setIsLoadingLoc] = useState(true);
    const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

    useEffect(() => {
        (async () => {
            try {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                    if (location && location.coords) {
                        setUserLocation({ lat: location.coords.latitude, lng: location.coords.longitude });
                    }
                }
            } catch (error) {
                // Keep default HCM location
            } finally {
                setIsLoadingLoc(false);
            }
        })();
    }, []);

    const formatPrice = (price) => {
        if (!price && price !== 0) return "Liên hệ";
        return price.toLocaleString("vi-VN") + "đ/giờ";
    };

    const displayVenues = sport 
        ? venues.filter(v => {
            const baseSport = sport.split('_')[0].toLowerCase();
            return v.sports && v.sports.some(s => s.toLowerCase().includes(baseSport));
        })
        : venues;

    const markersJs = displayVenues
        .filter(v => v.coordinates?.latitude && v.coordinates?.longitude)
        .map(v => {
            const popupHtml = `
                <div class="custom-popup">
                    <div class="popup-title">${v.name.replace(/'/g, "\\'")}</div>
                    <div class="popup-price">${formatPrice(v.price_per_hour)}</div>
                    <button class="btn-primary" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type: 'SELECT_COURT', id: '${v.id || v._id}', name: '${(v.name || "").replace(/'/g, "\\'")}'}))">Chọn sân này</button>
                </div>
            `;
            const safePopupHtml = popupHtml.replace(/[\r\n]+/g, '').replace(/'/g, "\\'");
            return `
                {
                    const el = document.createElement('div');
                    el.className = 'marker-icon';
                    el.style.backgroundColor = '#3B82F6';
                    const popup = new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML('${safePopupHtml}');
                    new mapboxgl.Marker({ element: el })
                        .setLngLat([${v.coordinates.longitude}, ${v.coordinates.latitude}])
                        .setPopup(popup)
                        .addTo(map);
                }
            `;
        }).join("\n");

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no">
            <link href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css" rel="stylesheet">
            <script src="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js"></script>
            <style>
                body { margin: 0; padding: 0; }
                #map { position: absolute; top: 0; bottom: 0; width: 100%; }
                .marker-icon { width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); cursor: pointer; }
                .user-marker { width: 14px; height: 14px; background-color: #EF4444; border-radius: 50%; border: 2px solid white; }
                .custom-popup { font-family: Arial, sans-serif; padding: 6px; width: 150px; text-align: center; }
                .popup-title { font-weight: bold; font-size: 12px; margin-bottom: 4px; }
                .popup-price { font-size: 11px; margin-bottom: 8px; color: #10B981; font-weight: bold; }
                .btn-primary { width: 100%; background-color: #10B981; color: white; border: none; padding: 6px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 11px; }
            </style>
        </head>
        <body>
            <div id="map"></div>
            <script>
                mapboxgl.accessToken = '${mapboxToken}';
                const map = new mapboxgl.Map({
                    container: 'map',
                    style: 'mapbox://styles/mapbox/streets-v12',
                    center: [${userLocation.lng}, ${userLocation.lat}],
                    zoom: 12
                });
                const userEl = document.createElement('div');
                userEl.className = 'user-marker';
                new mapboxgl.Marker({ element: userEl })
                    .setLngLat([${userLocation.lng}, ${userLocation.lat}])
                    .addTo(map);
                ${markersJs}
                map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
            </script>
        </body>
        </html>
    `;

    const handleMessage = (event) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'SELECT_COURT' && onSelectCourt) {
                onSelectCourt({ id: data.id, name: data.name });
            }
        } catch (error) {
            console.error("Lỗi parse message", error);
        }
    };

    if (isLoadingLoc) {
        return (
            <View style={{ height: 300, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 12 }}>
                <ActivityIndicator color="#10B981" />
            </View>
        );
    }

    return (
        <View style={{ height: 300, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 32 }}>
            <WebView
                ref={webViewRef}
                source={{ html: htmlContent, baseUrl: 'https://api.mapbox.com' }}
                originWhitelist={['*']}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                onMessage={handleMessage}
                nestedScrollEnabled={true}
                androidHardwareAccelerationDisabled={false}
                mixedContentMode="always"
                allowFileAccess={true}
                allowUniversalAccessFromFileURLs={true}
                allowFileAccessFromFileURLs={true}
            />
        </View>
    );
}
