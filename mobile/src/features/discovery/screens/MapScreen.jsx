import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, ActivityIndicator, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { WebView } from "react-native-webview";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import * as Location from 'expo-location';
import { Ionicons } from "@expo/vector-icons";

export default function MapScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const webViewRef = useRef(null);
    const { venues = [] } = useSelector((state) => state.venue);
    const [userLocation, setUserLocation] = useState(null);
    const [isLoadingLoc, setIsLoadingLoc] = useState(true);
    const [searchAddress, setSearchAddress] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    // Nếu được điều hướng từ chi tiết sân, sẽ có latitude/longitude
    const { latitude, longitude, venueName, mode, sport } = route.params || {};

    // Mặc định TPHCM nếu không có
    const lat = latitude || 10.762622;
    const lng = longitude || 106.660172;
    const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "";

    /**
     * Helper: lấy vị trí GPS với timeout 5s, fallback về HCM
     * @returns {{ lat: number, lng: number }}
     */
    const getLocationWithFallback = async () => {
        const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
        if (permStatus !== 'granted') throw new Error('permission_denied');

        // 1) Thử lấy vị trí đã cache (gần như instant)
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown && lastKnown.coords) {
            console.log("[MapScreen] Dùng vị trí cached");
            return { lat: lastKnown.coords.latitude, lng: lastKnown.coords.longitude };
        }

        // 2) Fallback: lấy GPS thật với timeout 15s, accuracy thấp cho nhanh
        const locationPromise = Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Location timeout")), 15000)
        );
        const location = await Promise.race([locationPromise, timeoutPromise]);
        return { lat: location.coords.latitude, lng: location.coords.longitude };
    };

    useEffect(() => {
        (async () => {
            try {
                const coords = await getLocationWithFallback();
                setUserLocation(coords);
            } catch (error) {
                console.log("[MapScreen] GPS fallback to HCM:", error.message);
                setUserLocation({ lat: 10.762622, lng: 106.660172 });
            } finally {
                setIsLoadingLoc(false);
            }
        })();
    }, []);

    // Format giá tiền
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

    // Chuẩn bị JS để render marker & popup cho các sân
    const markersJs = displayVenues
        .filter(v => v.coordinates?.latitude && v.coordinates?.longitude)
        .map(v => {
            const popupHtml = `
                <div class="custom-popup">
                    <div class="popup-header">
                        <div class="popup-title">${v.name.replace(/'/g, "\\'")}</div>
                        <div class="popup-badge">Đang mở</div>
                    </div>
                    <div class="popup-address">${(v.location || "").replace(/'/g, "\\'")}</div>
                    <div class="popup-info">
                        <div class="popup-price">${formatPrice(v.price_per_hour)}</div>
                        <div class="popup-rating">⭐ ${v.avg_rating || "0.0"}</div>
                    </div>
                    <button class="btn-primary" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type: '${mode === 'selectForMatchmaking' ? 'SELECT_COURT' : 'VIEW_DETAIL'}', id: '${v.id || v._id}', name: '${(v.name || "").replace(/'/g, "\\'")}'}))">${mode === 'selectForMatchmaking' ? 'Chọn sân này' : 'Xem chi tiết'}</button>
                    <button class="btn-outline" onclick="drawRoute(${v.coordinates.latitude}, ${v.coordinates.longitude})">Chỉ đường</button>
                </div>
            `;
            const safePopupHtml = popupHtml.replace(/[\r\n]+/g, '').replace(/'/g, "\\'");

            return `
                {
                    const el = document.createElement('div');
                    el.className = 'marker-icon';
                    el.style.backgroundColor = '${venueName === v.name ? "#EF4444" : "#3B82F6"}';
                    
                    const popup = new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML('${safePopupHtml}');
                    
                    const marker = new mapboxgl.Marker({ element: el })
                        .setLngLat([${v.coordinates.longitude}, ${v.coordinates.latitude}])
                        .setPopup(popup)
                        .addTo(map);
                        
                    ${venueName === v.name ? `marker.togglePopup();` : ''}
                }
            `;
        })
        .join("\n");

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
                .marker-icon {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    border: 3px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    cursor: pointer;
                }
                .user-marker {
                    width: 16px;
                    height: 16px;
                    background-color: #3B82F6;
                    border-radius: 50%;
                    border: 3px solid white;
                    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
                }
                .custom-popup {
                    font-family: Arial, sans-serif;
                    padding: 8px;
                    width: 220px;
                }
                .popup-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 4px;
                }
                .popup-title {
                    font-weight: bold;
                    font-size: 14px;
                    color: #111827;
                    flex: 1;
                }
                .popup-badge {
                    background-color: #D1FAE5;
                    color: #059669;
                    font-size: 10px;
                    padding: 2px 6px;
                    border-radius: 12px;
                    font-weight: bold;
                    margin-left: 8px;
                }
                .popup-address {
                    font-size: 11px;
                    color: #6B7280;
                    margin-bottom: 8px;
                    line-height: 1.3;
                }
                .popup-info {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }
                .popup-price {
                    font-weight: bold;
                    font-size: 12px;
                    color: #111827;
                }
                .popup-rating {
                    font-size: 12px;
                    color: #F59E0B;
                    font-weight: bold;
                }
                .btn-primary {
                    width: 100%;
                    background-color: #111827;
                    color: white;
                    border: none;
                    padding: 8px;
                    border-radius: 8px;
                    font-weight: bold;
                    margin-bottom: 6px;
                    cursor: pointer;
                }
                .btn-outline {
                    width: 100%;
                    background-color: white;
                    color: #111827;
                    border: 1px solid #D1D5DB;
                    padding: 8px;
                    border-radius: 8px;
                    font-weight: bold;
                    cursor: pointer;
                }
                .mapboxgl-popup-content {
                    border-radius: 12px;
                    padding: 10px;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                }
                /* Route info bar */
                .route-info {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: white;
                    padding: 12px 16px;
                    box-shadow: 0 -4px 12px rgba(0,0,0,0.1);
                    display: none;
                    z-index: 999;
                    border-radius: 16px 16px 0 0;
                }
                .route-info.active { display: flex; flex-direction: column; }
                .route-info-row { display: flex; align-items: center; justify-content: space-between; width: 100%; }
                .route-info .info-text { font-size: 14px; color: #111827; }
                .route-info .info-text strong { color: #059669; }
                .btn-vehicle {
                    padding: 6px 12px;
                    border: 1px solid #D1D5DB;
                    background: white;
                    border-radius: 20px;
                    font-size: 12px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    margin-right: 8px;
                }
                .btn-vehicle.active {
                    background: #E0F2FE;
                    border-color: #3B82F6;
                    color: #1D4ED8;
                    font-weight: bold;
                }
                .vehicle-types { display: flex; margin-bottom: 10px; width: 100%; }
                .route-info .btn-close-route {
                    background: #EF4444;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-weight: bold;
                    font-size: 13px;
                    cursor: pointer;
                }
            </style>
        </head>
        <body>
            <div id="map"></div>
            <div class="route-info" id="routeInfo">
                <div class="vehicle-types">
                    <button id="btn-driving" class="btn-vehicle active" onclick="drawRoute(window.currentDestLat, window.currentDestLng, 'driving')"> Ô tô</button>
                    <button id="btn-cycling" class="btn-vehicle" onclick="drawRoute(window.currentDestLat, window.currentDestLng, 'cycling')"> Xe máy</button>
                </div>
                <div class="route-info-row">
                    <div class="info-text" id="routeText"></div>
                    <button class="btn-close-route" onclick="clearRoute()">Đóng</button>
                </div>
            </div>
            <script>
                mapboxgl.accessToken = '${process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? mapboxToken}';
                
                let centerLng = ${lng};
                let centerLat = ${lat};
                ${userLocation && !venueName ? `
                    centerLng = ${userLocation.lng};
                    centerLat = ${userLocation.lat};
                ` : ''}

                const map = new mapboxgl.Map({
                    container: 'map',
                    style: 'mapbox://styles/mapbox/streets-v12',
                    center: [centerLng, centerLat],
                    zoom: 13,
                    pitch: 0
                });

                map.on('error', function(e) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_ERROR', error: e.error ? e.error.message : 'Unknown' }));
                });

                // User location marker
                ${userLocation ? `
                    const userEl = document.createElement('div');
                    userEl.className = 'user-marker';
                    window.userMarker = new mapboxgl.Marker({ element: userEl })
                        .setLngLat([${userLocation.lng}, ${userLocation.lat}])
                        .addTo(map);
                    window.userLat = ${userLocation.lat};
                    window.userLng = ${userLocation.lng};
                ` : `
                    window.userLat = ${lat};
                    window.userLng = ${lng};
                `}

                // Render all venue markers
                ${markersJs}

                map.addControl(new mapboxgl.NavigationControl(), 'top-right');

                // ── In-app directions ──
                window.currentDestLat = null;
                window.currentDestLng = null;
                window.currentProfile = 'driving';

                function drawRoute(destLat, destLng, profile = window.currentProfile) {
                    window.currentDestLat = destLat;
                    window.currentDestLng = destLng;
                    window.currentProfile = profile;
                    
                    document.getElementById('btn-driving').className = profile === 'driving' ? 'btn-vehicle active' : 'btn-vehicle';
                    document.getElementById('btn-cycling').className = profile === 'cycling' ? 'btn-vehicle active' : 'btn-vehicle';

                    var origin = window.userLng + ',' + window.userLat;
                    var dest = destLng + ',' + destLat;
                    var url = 'https://api.mapbox.com/directions/v5/mapbox/' + profile + '/' + origin + ';' + dest + '?geometries=geojson&overview=full&access_token=' + mapboxgl.accessToken;
                    
                    fetch(url)
                        .then(function(r) { return r.json(); })
                        .then(function(data) {
                            if (!data.routes || data.routes.length === 0) {
                                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ROUTE_ERROR' }));
                                return;
                            }
                            var route = data.routes[0];
                            var coords = route.geometry;
                            var distKm = (route.distance / 1000).toFixed(1);
                            var durMin = Math.round(route.duration / 60);

                            // Remove old route if exists
                            if (map.getSource('route')) {
                                map.removeLayer('route-line');
                                map.removeSource('route');
                            }

                            map.addSource('route', { type: 'geojson', data: { type: 'Feature', geometry: coords } });
                            map.addLayer({
                                id: 'route-line',
                                type: 'line',
                                source: 'route',
                                layout: { 'line-join': 'round', 'line-cap': 'round' },
                                paint: { 'line-color': '#059669', 'line-width': 5, 'line-opacity': 0.85 }
                            });

                            // Fit map to route
                            var allCoords = coords.coordinates;
                            var bounds = new mapboxgl.LngLatBounds(allCoords[0], allCoords[0]);
                            allCoords.forEach(function(c) { bounds.extend(c); });
                            map.fitBounds(bounds, { padding: 60 });

                            // Show route info bar
                            var vehicleText = profile === 'driving' ? 'lái xe' : 'xe máy';
                            document.getElementById('routeText').innerHTML = '<strong>' + distKm + ' km</strong> &bull; ' + durMin + ' phút ' + vehicleText;
                            document.getElementById('routeInfo').className = 'route-info active';
                        })
                        .catch(function(err) {
                            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ROUTE_ERROR' }));
                        });
                }

                function clearRoute() {
                    if (map.getSource('route')) {
                        map.removeLayer('route-line');
                        map.removeSource('route');
                    }
                    document.getElementById('routeInfo').className = 'route-info';
                }
            </script>
        </body>
        </html>
    `;

    const handleMessage = (event) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'VIEW_DETAIL') {
                navigation.navigate("Đặt lịch", { courtId: data.id });
            } else if (data.type === 'SELECT_COURT') {
                navigation.navigate("BottomTabs", { screen: "Ghép Kèo", params: { selectedCourtId: data.id, selectedCourtName: data.name } });
            } else if (data.type === 'ROUTE_ERROR') {
                Alert.alert("Lỗi", "Không thể tìm đường đi. Vui lòng thử lại.");
            } else if (data.type === 'MAP_ERROR') {
                console.warn("[MapScreen] Map error:", data.error);
            }
        } catch (error) {
            console.error("Lỗi parse message từ WebView", error);
        }
    };

    const handleSearchAddress = async () => {
        if (!searchAddress.trim()) return;
        setIsSearching(true);
        try {
            const res = await fetch(`https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(searchAddress)}&access_token=${mapboxToken}&limit=1`);
            const data = await res.json();
            if (data.features && data.features.length > 0) {
                const [lng, lat] = data.features[0].geometry.coordinates;
                if (webViewRef.current) {
                    webViewRef.current.injectJavaScript(`
                        if (window.userMarker) {
                            window.userMarker.setLngLat([${lng}, ${lat}]);
                        } else {
                            const userEl = document.createElement('div');
                            userEl.className = 'user-marker';
                            window.userMarker = new mapboxgl.Marker({ element: userEl })
                                .setLngLat([${lng}, ${lat}])
                                .addTo(map);
                        }
                        window.userLat = ${lat};
                        window.userLng = ${lng};
                        map.flyTo({ center: [${lng}, ${lat}], zoom: 14 });
                        true;
                    `);
                }
            } else {
                Alert.alert("Không tìm thấy", "Vui lòng thử nhập địa chỉ rõ ràng hơn.");
            }
        } catch (error) {
            Alert.alert("Lỗi", "Không thể tìm kiếm địa chỉ lúc này.");
        } finally {
            setIsSearching(false);
        }
    };

    const handleUseMyLocation = async () => {
        setIsSearching(true);
        try {
            const coords = await getLocationWithFallback();
            if (webViewRef.current) {
                webViewRef.current.injectJavaScript(`
                    if (window.userMarker) {
                        window.userMarker.setLngLat([${coords.lng}, ${coords.lat}]);
                    } else {
                        const userEl = document.createElement('div');
                        userEl.className = 'user-marker';
                        window.userMarker = new mapboxgl.Marker({ element: userEl })
                            .setLngLat([${coords.lng}, ${coords.lat}])
                            .addTo(map);
                    }
                    window.userLat = ${coords.lat};
                    window.userLng = ${coords.lng};
                    map.flyTo({ center: [${coords.lng}, ${coords.lat}], zoom: 14 });
                    true;
                `);
            }
        } catch (e) {
            const hcmLat = 10.762622;
            const hcmLng = 106.660172;
            Alert.alert("Cảnh báo", "Không lấy được vị trí thực tế. Đã dùng vị trí mặc định TP.HCM.");
            if (webViewRef.current) {
                webViewRef.current.injectJavaScript(`
                    if (window.userMarker) {
                        window.userMarker.setLngLat([${hcmLng}, ${hcmLat}]);
                    } else {
                        const userEl = document.createElement('div');
                        userEl.className = 'user-marker';
                        window.userMarker = new mapboxgl.Marker({ element: userEl })
                            .setLngLat([${hcmLng}, ${hcmLat}])
                            .addTo(map);
                    }
                    window.userLat = ${hcmLat};
                    window.userLng = ${hcmLng};
                    map.flyTo({ center: [${hcmLng}, ${hcmLat}], zoom: 14 });
                    true;
                `);
            }
        } finally {
            setIsSearching(false);
        }
    };

    if (isLoadingLoc) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#059669" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <WebView
                ref={webViewRef}
                source={{ html: htmlContent, baseUrl: 'https://api.mapbox.com' }}
                style={styles.map}
                originWhitelist={['*']}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                onMessage={handleMessage}
                androidHardwareAccelerationDisabled={false}
                mixedContentMode="always"
                allowFileAccess={true}
                allowUniversalAccessFromFileURLs={true}
                allowFileAccessFromFileURLs={true}
                onError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.warn('[MapScreen] WebView error:', nativeEvent);
                }}
            />

            {/* Search Overlay */}
            {!venueName && (
                <View style={styles.searchOverlayContainer}>
                    <View style={styles.searchOverlay}>
                        <TouchableOpacity onPress={handleSearchAddress} disabled={isSearching} style={styles.searchIconBtn}>
                            <Ionicons name="search" size={18} color="#10B981" />
                        </TouchableOpacity>

                        <TextInput
                            style={styles.input}
                            placeholder="Tìm địa chỉ, quận/huyện..."
                            value={searchAddress}
                            onChangeText={setSearchAddress}
                            onSubmitEditing={handleSearchAddress}
                            returnKeyType="search"
                        />

                        <View style={styles.dividerVertical} />

                        <TouchableOpacity
                            style={styles.btnMyLocation}
                            onPress={handleUseMyLocation}
                            disabled={isSearching}
                        >
                            {isSearching ? (
                                <ActivityIndicator size="small" color="#10B981" />
                            ) : (
                                <Ionicons name="locate" size={18} color="#10B981" />
                            )}
                        </TouchableOpacity>
                    </View>

                    {displayVenues.length > 0 && (
                        <View style={styles.badgeFloat}>
                            <Text style={styles.badgeTextFloat}>Hiển thị {displayVenues.length} sân</Text>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    searchOverlayContainer: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        alignItems: 'center',
    },
    searchOverlay: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 20,
        paddingHorizontal: 8,
        paddingVertical: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
        width: '80%',
    },
    searchIconBtn: {
        padding: 4,
    },
    input: {
        flex: 1,
        fontSize: 13,
        paddingHorizontal: 8,
        color: '#111827',
    },
    dividerVertical: {
        width: 1,
        height: 16,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 8,
    },
    btnMyLocation: {
        padding: 4,
    },
    badgeFloat: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
        marginTop: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    badgeTextFloat: {
        fontSize: 12,
        color: '#059669',
        fontWeight: 'bold',
    },
});
