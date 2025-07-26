
        const centers = [
            { name: "Dedicated Economic Centre - Ampara", coords: [7.234089140563389, 81.64709772096288] },
            { name: "Dedicated Economic Centre - Bokundara", coords: [6.819169926453202, 79.91780315372831] },
            { name: "Dedicated Economic Centre - Dambulla", coords: [7.866007107332625, 80.65176687532937] },
            { name: "Dedicated Economic Centre - Embilipitiya", coords: [6.321523320194482, 80.84627275756523] },
            { name: "Dedicated Economic Centre - Jaffna", coords: [9.711573091675916, 80.13763731024112] },
            { name: "Dedicated Economic Centre - Kandahandiya", coords: [7.213530416152124, 80.75487580362889] },
            { name: "Dedicated Economic Centre - Keppatipola", coords: [6.8959450703314475, 80.87403450254789] },
            { name: "Dedicated Economic Centre - Kilinochchi", coords: [9.38319454676344, 80.39439456989557] },
            { name: "Dedicated Economic Centre - Kuruduwaththa", coords: [7.127773363965376, 80.52968145140511] },
            { name: "Dedicated Economic Centre - Meegoda", coords: [6.843672417174182, 80.04598152498541] },
            { name: "Dedicated Economic Centre - Narahenpita", coords: [6.891907135863367, 79.88295167144986] },
            { name: "Dedicated Economic Centre - Nuwaraeliya", coords: [6.967875993162986, 80.77258467608766] },
            { name: "Dedicated Economic Centre - Rathmalana", coords: [6.808772148129417, 79.87425563957892] },
            { name: "Dedicated Economic Centre - Thambuttegama", coords: [8.164293152648916, 80.3023779824173] },
            { name: "Dedicated Economic Centre - Vavuniya", coords: [8.738313640074708, 80.49051595433932] },
            { name: "Dedicated Economic Centre - Veyangoda", coords: [7.1588686656905125, 80.05783563466775] },
            { name: "Dedicated Economic Centre - Welisara", coords: [7.0147270996588915, 79.8997213694314] },
            { name: "Economic Centre - Egaloya", coords: [6.678800418048153, 80.16182824956586] },
            { name: "Economic Centre - Menikkumbura", coords: [7.325355733672226, 80.62419028662111] },
            { name: "Economic Centre - Norochcholai", coords: [8.048536590020808, 79.73721825402636] }
        ];

        var submitted = false;
        let routeLayer = null;
        let localSubmissions = [];
        let map;
        let selectedMarker;

        // Distance Calculator Variables
        let calcMode = null; // 'route' or 'nearest'
        let calcPoints = []; // For route calculation
        let calcMarkers = []; // Store calculation markers
        let calcRoutes = []; // Store calculation routes

        function getSelectValue(selectId, otherId) {
            const select = document.getElementById(selectId);
            const otherInput = document.getElementById(otherId);
            
            if (select.value === "Other" && otherInput && otherInput.value.trim() !== "") {
                return otherInput.value.trim();
            }
            return select.value;
        }

        function getCheckboxValues(name, otherId = null) {
            const checkboxes = document.querySelectorAll('input[name="' + name + '"]:checked');
            const values = [];
            
            for (let checkbox of checkboxes) {
                if (checkbox.value === "Other" && otherId) {
                    const otherInput = document.getElementById(otherId);
                    if (otherInput && otherInput.value.trim() !== "") {
                        values.push(otherInput.value.trim());
                    } else {
                        values.push("Other");
                    }
                } else {
                    values.push(checkbox.value);
                }
            }
            
            return values.join(", ");
        }

        function toggleOtherInput(selectElement, inputId) {
            const input = document.getElementById(inputId);
            if (selectElement.value === "Other") {
                input.classList.remove("hidden");
                input.setAttribute("required", "required");
            } else {
                input.classList.add("hidden");
                input.removeAttribute("required");
                input.value = "";
            }
        }

        function toggleProblemOther() {
            const checkbox = document.getElementById("problem_other_cb");
            const input = document.getElementById("problem_other");
            if (checkbox.checked) {
                input.classList.remove("hidden");
                input.setAttribute("required", "required");
            } else {
                input.classList.add("hidden");
                input.removeAttribute("required");
                input.value = "";
            }
        }

        function validateAtLeastOneChecked(name) {
            const checkboxes = document.querySelectorAll('input[name="' + name + '"]');
            for (let cb of checkboxes) {
                if (cb.checked) return true;
            }
            return false;
        }

        function getSellingPlaceCoords(sellingPlace) {
            const center = centers.find(c => c.name === sellingPlace);
            return center ? center.coords : null;
        }

        async function calculateAndDisplayRoute(farmLat, farmLng, destinationCoords, sellingPlace) {
            const apiKey = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjRmMGI2ZTViYTAyNTliY2FhNTg3ZWQyYTBkOTZiMTIyYzY5NmFkYTc1NTUyNTUwMGZmZDJiZWY3IiwiaCI6Im11cm11cjY0In0=";
            
            try {
                const response = await fetch(`https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${destinationCoords[1]},${destinationCoords[0]}&end=${farmLng},${farmLat}`);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data.features && data.features.length > 0) {
                    const route = data.features[0];
                    const coordinates = route.geometry.coordinates;
                    const distance = (route.properties.segments[0].distance / 1000).toFixed(2);
                    const duration = Math.round(route.properties.segments[0].duration / 60);
                    
                    if (routeLayer) {
                        map.removeLayer(routeLayer);
                    }
                    
                    const leafletCoords = coordinates.map(coord => [coord[1], coord[0]]);
                    
                    routeLayer = L.polyline(leafletCoords, {
                        color: 'red',
                        weight: 4,
                        opacity: 0.7
                    }).addTo(map);
                    
                    map.fitBounds(routeLayer.getBounds(), { padding: [20, 20] });
                    
                    const mainRole = getSelectValue("mainrole", "mainrole_other");
                    const farmLocation = document.getElementById("district").value;
                    const mainProduct = getSelectValue("mainproductyoutransport", "mainproduct_other");
                    const vehicleType = getCheckboxValues("vehicle");
                    const itemsBringBack = getCheckboxValues("item");
                    const visitFrequency = document.getElementById("marketvisitfrequency").value;
                    const suggestions = document.getElementById("suggestionsorcomments").value || "None";
                    
                    const popupContent = `
                        <div style="text-align: center; font-family: Arial, sans-serif; max-width: 350px;">
                            <h3 style="color: #2e7d32; margin: 0 0 15px 0;">🚛 Route & Transport Details</h3>
                            
                            <div style="background: #f5f5f5; padding: 12px; border-radius: 8px; margin: 10px 0;">
                                <h4 style="margin: 0 0 8px 0; color: #1976d2;">📍 Route Information</h4>
                                <p style="margin: 5px 0;"><strong>From:</strong> ${farmLocation} (Farm Location)</p>
                                <p style="margin: 5px 0;"><strong>To:</strong> ${sellingPlace}</p>
                                <p style="margin: 5px 0; font-size: 16px; color: #d32f2f;"><strong>📏 Distance:</strong> ${distance} km</p>
                                <p style="margin: 5px 0; font-size: 16px; color: #d32f2f;"><strong>⏱️ Time:</strong> ${duration} minutes</p>
                            </div>
                            
                            <div style="background: #e8f5e8; padding: 12px; border-radius: 8px; margin: 10px 0; text-align: left;">
                                <h4 style="margin: 0 0 8px 0; color: #2e7d32; text-align: center;">👤 User Details</h4>
                                <p style="margin: 5px 0;"><strong>🚜 Role:</strong> ${mainRole}</p>
                                <p style="margin: 5px 0;"><strong>🌾 Main Product:</strong> ${mainProduct}</p>
                                <p style="margin: 5px 0;"><strong>🚛 Vehicle Type:</strong> ${vehicleType}</p>
                                <p style="margin: 5px 0;"><strong>📦 Return Items:</strong> ${itemsBringBack}</p>
                                <p style="margin: 5px 0;"><strong>📅 Visit Frequency:</strong> ${visitFrequency}</p>
                                ${suggestions !== "None" ? `<p style="margin: 5px 0;"><strong>💬 Comments:</strong> ${suggestions}</p>` : ''}
                            </div>
                            
                            <p style="margin: 10px 0; font-size: 12px; color: #666;">Route shown in red on the map</p>
                        </div>
                    `;
                    
                    const midIndex = Math.floor(leafletCoords.length / 2);
                    const midPoint = leafletCoords[midIndex];
                    
                    L.popup({
                        maxWidth: 400,
                        className: 'route-popup'
                    })
                    .setLatLng(midPoint)
                    .setContent(popupContent)
                    .openOn(map);
                    
                } else {
                    alert("Could not calculate route. Please check the locations.");
                }
                
            } catch (error) {
                console.error("Error calculating route:", error);
                alert("Error calculating route. Please try again.");
            }
        }

        // Distance Calculator Functions
        async function calculateRouteDistance(point1, point2) {
            const apiKey = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjRmMGI2ZTViYTAyNTliY2FhNTg3ZWQyYTBkOTZiMTIyYzY5NmFkYTc1NTUyNTUwMGZmZDJiZWY3IiwiaCI6Im11cm11cjY0In0=";
            
            try {
                const response = await fetch(`https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${point1.lng},${point1.lat}&end=${point2.lng},${point2.lat}`);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data.features && data.features.length > 0) {
                    const route = data.features[0];
                    const coordinates = route.geometry.coordinates;
                    const distance = (route.properties.segments[0].distance / 1000).toFixed(2);
                    const duration = Math.round(route.properties.segments[0].duration / 60);
                    
                    const leafletCoords = coordinates.map(coord => [coord[1], coord[0]]);
                    
                    const routeLine = L.polyline(leafletCoords, {
                        color: 'purple',
                        weight: 3,
                        opacity: 0.8
                    }).addTo(map);
                    
                    calcRoutes.push(routeLine);
                    
                    const midIndex = Math.floor(leafletCoords.length / 2);
                    const midPoint = leafletCoords[midIndex];
                    
                    const popupContent = `
                        <div style="text-align: center; font-family: Arial, sans-serif;">
                            <h3 style="color: #7b1fa2; margin: 0 0 10px 0;">📏 Route Distance</h3>
                            <p style="margin: 5px 0; font-size: 16px;"><strong>Distance:</strong> ${distance} km</p>
                            <p style="margin: 5px 0; font-size: 16px;"><strong>Estimated Time:</strong> ${duration} minutes</p>
                        </div>
                    `;
                    
                    L.popup()
                        .setLatLng(midPoint)
                        .setContent(popupContent)
                        .openOn(map);
                    
                    return { distance, duration };
                }
            } catch (error) {
                console.error("Error calculating route:", error);
                return null;
            }
        }

        function calculateDistance(lat1, lng1, lat2, lng2) {
            const R = 6371; // Earth's radius in kilometers
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLng = (lng2 - lng1) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                    Math.sin(dLng/2) * Math.sin(dLng/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return R * c;
        }

        async function findNearestCenters(clickPoint) {
            const distances = centers.map(center => ({
                ...center,
                distance: calculateDistance(clickPoint.lat, clickPoint.lng, center.coords[0], center.coords[1])
            })).sort((a, b) => a.distance - b.distance).slice(0, 3);

            document.getElementById('nearestCentersList').innerHTML = '';
            
            for (let i = 0; i < distances.length; i++) {
                const center = distances[i];
                
                try {
                    const routeInfo = await calculateRouteDistance(clickPoint, {
                        lat: center.coords[0], 
                        lng: center.coords[1]
                    });
                    
                    const centerDiv = document.createElement('div');
                    centerDiv.className = 'center-item';
                    centerDiv.innerHTML = `
                        <strong>${i + 1}. ${center.name}</strong><br>
                        📏 Distance: ${routeInfo ? routeInfo.distance + ' km' : center.distance.toFixed(2) + ' km (direct)'}<br>
                        ⏱️ Time: ${routeInfo ? routeInfo.duration + ' min' : 'N/A'}
                    `;
                    
                    centerDiv.addEventListener('click', () => {
                        map.setView([center.coords[0], center.coords[1]], 10);
                    });
                    
                    document.getElementById('nearestCentersList').appendChild(centerDiv);
                    
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                } catch (error) {
                    console.error(`Error calculating route to ${center.name}:`, error);
                    
                    const centerDiv = document.createElement('div');
                    centerDiv.className = 'center-item';
                    centerDiv.innerHTML = `
                        <strong>${i + 1}. ${center.name}</strong><br>
                        📏 Distance: ${center.distance.toFixed(2)} km (direct)<br>
                        ⏱️ Time: N/A
                    `;
                    
                    document.getElementById('nearestCentersList').appendChild(centerDiv);
                }
            }
        }

        function clearCalculatorElements() {
            calcMarkers.forEach(marker => map.removeLayer(marker));
            calcMarkers = [];
            
            calcRoutes.forEach(route => map.removeLayer(route));
            calcRoutes = [];
            
            calcPoints = [];
            
            document.getElementById('nearestCentersList').innerHTML = '';

            map.closePopup();
        }

        function resetCalculator() {
            clearCalculatorElements();
            calcMode = null;
            document.querySelectorAll('.calc-option').forEach(opt => opt.classList.remove('active'));
            document.getElementById('calcStatus').textContent = 'Select an option above';
        }

        function addLocalSubmission() {
            const newSubmission = {
                "Main role": getSelectValue("mainrole", "mainrole_other"),
                "Farm location (district)": document.getElementById("district").value,
                "latitude": document.getElementById("latitude").value,
                "longitude": document.getElementById("longitude").value,
                "Usual selling place (Economic Center or Market)": getSelectValue("usualsellingplace", "usualsellingplace_other"),
                "Main product you transport": getSelectValue("mainproductyoutransport", "mainproduct_other"),
                "Type of vehicle used for transport": getCheckboxValues("vehicle"),
                "Market visit frequency": document.getElementById("marketvisitfrequency").value,
                "Items you bring back after selling": getCheckboxValues("item"),
                "Problems you face in transportation": getCheckboxValues("problem", "problem_other"),
                "Suggestions or comments (optional)": document.getElementById("suggestionsorcomments").value || "None"
            };
            
            localSubmissions.push(newSubmission);
            return newSubmission;
        }

        function submitButton() {
            const validVehicle = validateAtLeastOneChecked("vehicle");
            const validItem = validateAtLeastOneChecked("item");
            const validProblem = validateAtLeastOneChecked("problem");

            if (!validVehicle) {
                alert("Please select at least one vehicle type.");
                return false;
            }

            if (!validItem) {
                alert("Please select at least one item you bring back after selling.");
                return false;
            }

            if (!validProblem) {
                alert("Please select at least one transportation problem.");
                return false;
            }

            document.getElementById("google_mainrole").value = getSelectValue("mainrole", "mainrole_other");
            document.getElementById("google_farmlocation").value = document.getElementById("district").value;
            document.getElementById("google_latitude").value = document.getElementById("latitude").value;
            document.getElementById("google_longitude").value = document.getElementById("longitude").value;
            document.getElementById("google_usualsellingplace").value = getSelectValue("usualsellingplace", "usualsellingplace_other");
            document.getElementById("google_mainproductyoutransport").value = getSelectValue("mainproductyoutransport", "mainproduct_other");
            document.getElementById("google_typeofvehicleusedfortransport").value = getCheckboxValues("vehicle");
            document.getElementById("google_marketvisitfrequency").value = document.getElementById("marketvisitfrequency").value;
            document.getElementById("google_itemsyoubringbackafterselling").value = getCheckboxValues("item");
            document.getElementById("google_problemsyoufaceintransportation").value = getCheckboxValues("problem", "problem_other");
            document.getElementById("google_suggestionsorcomments").value = document.getElementById("suggestionsorcomments").value;

            const latitude = document.getElementById("latitude").value.trim();
            const longitude = document.getElementById("longitude").value.trim();
            if (latitude === "" || longitude === "") {
                alert("Please select a crop origin location on the map.");
                return false;
            }

            const newSubmission = addLocalSubmission();
            updateStatsInstantly();
            addSurveyPointToMap(newSubmission);

            const sellingPlace = getSelectValue("usualsellingplace", "usualsellingplace_other");
            const destinationCoords = getSellingPlaceCoords(sellingPlace);
            
            if (destinationCoords) {
                calculateAndDisplayRoute(parseFloat(latitude), parseFloat(longitude), destinationCoords, sellingPlace);
            }
            
            submitted = true;
            document.getElementById("googleform").submit();
            
            setTimeout(function() {
                alert("Form is Submitted Successfully! Check the map for the shortest route to your selected market.");
                document.getElementById("mainform").reset();

                if (selectedMarker) {
                    map.removeLayer(selectedMarker);
                    selectedMarker = null;
                }

                document.querySelectorAll('.other-input').forEach(field => {
                    field.classList.add('hidden');
                    field.removeAttribute('required');
                    field.value = "";
                });

                document.getElementById("locationStatus").innerText = "No location selected.";
            }, 1000);

            return false;
        }

        function addSurveyPointToMap(submission) {
            const lat = parseFloat(submission.latitude);
            const lng = parseFloat(submission.longitude);
            if (!isNaN(lat) && !isNaN(lng)) {
                const popupText = `
                    <strong>🚜 ${submission["Main role"] || "Unknown"}</strong><br>
                    📍 ${submission["Farm location (district)"] || "Unknown"}<br>
                    🛒 ${submission["Usual selling place (Economic Center or Market)"] || "Unknown"}<br>
                    🌾 ${submission["Main product you transport"] || "Unknown"}<br>
                    🚛 ${submission["Type of vehicle used for transport"] || "Unknown"}<br>
                    📦 ${submission["Items you bring back after selling"] || "Unknown"}<br>
                    ⏱️ ${submission["Market visit frequency"] || "Unknown"}<br>
                    💬 ${submission["Suggestions or comments (optional)"] || "None"}
                `;
                L.circleMarker([lat, lng], { radius: 5, color: 'blue' })
                    .addTo(map)
                    .bindPopup(popupText);
            }
        }

        function updateStatsInstantly() {
            const allData = [...(window.serverData || []), ...localSubmissions];
            
            document.getElementById("stat-responses").innerHTML = `<strong>📊 Responses: ${allData.length}</strong>`;

            const cropCounts = {};
            allData.forEach(r => {
                const crop = r["Main product you transport"];
                if (crop) {
                    cropCounts[crop] = (cropCounts[crop] || 0) + 1;
                }
            });

            const maxCount = Math.max(...Object.values(cropCounts));
            const topCrops = Object.entries(cropCounts)
                .filter(([crop, count]) => count === maxCount)
                .map(([crop]) => crop);

            document.getElementById("stat-maincrop").innerText = `${topCrops.join(", ")}`;

            const markets = allData.map(r => r["Usual selling place (Economic Center or Market)"]);
            const topMarket = getMostCommonValue(markets);
            document.getElementById("stat-topmarket").innerText = `${topMarket}`;

            const targetCrops = ["Vegetables", "Rice", "Dairy", "Fruits", "Other"];
            const cropDistrictCount = {};

            allData.forEach(r => {
                const crop = r["Main product you transport"];
                const district = r["Farm location (district)"];
                if (crop && district && targetCrops.includes(crop)) {
                    if (!cropDistrictCount[crop]) cropDistrictCount[crop] = {};
                    cropDistrictCount[crop][district] = (cropDistrictCount[crop][district] || 0) + 1;
                }
            });

            const cropDistrictSummary = targetCrops.map(crop => {
                if (cropDistrictCount[crop]) {
                    const topDistrict = Object.entries(cropDistrictCount[crop])
                        .reduce((a, b) => a[1] > b[1] ? a : b)[0];
                    return `${crop} from: ${topDistrict}`;
                } else {
                    return `${crop}: None`;
                }
            }).join("<br>");

            document.getElementById("stat-topdistrict").innerHTML = cropDistrictSummary;

            const allowedProblems = [
                "Bad roads", "High fuel cost", "No vehicle", "Long distance", "No Problems", "Other"
            ];

            const emojiMap = {
                "Bad roads": "🛣️",
                "High fuel cost": "⛽",
                "No vehicle": "🚫",
                "Long distance": "📏",
                "No Problems": "❌",
                "Other": "❓"
            };

            const problemCounts = {};
            allData.forEach(r => {
                const problems = (r["Problems you face in transportation"] || "").split(",").map(p => p.trim());
                problems.forEach(p => {
                    if (p) problemCounts[p] = (problemCounts[p] || 0) + 1;
                });
            });

            const filteredLines = allowedProblems.map(p => {
                const emoji = emojiMap[p] || "";
                const count = problemCounts[p] || 0;
                return `${emoji} ${p} (${count})`;
            }).join("<br>");
            
            const ctx = document.getElementById("transportIssuesChart").getContext("2d");
            if (window.transportChart) {
                window.transportChart.destroy();
            }
            window.transportChart = new Chart(ctx, {
                type: "doughnut",
                data: {
                    labels: allowedProblems,
                    datasets: [{
                        data: allowedProblems.map(p => problemCounts[p] || 0),
                        backgroundColor: ["#f44336", "#ff9800", "#9c27b0", "#03a9f4", "#4caf50", "#607d8b"],
                        borderWidth: 1
                    }]
                },
                options: {
                    cutout: '70%',
                    plugins: {
                        legend: {
                            display: true,
                            position: 'bottom'
                        }
                    }
                }
            });

            const allProblemLines = Object.entries(problemCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([p, count]) => `• ${p} (${count})`)
                .join("<br>");

            document.getElementById("allTransportIssuesList").innerHTML = allProblemLines;
        }

        document.addEventListener('DOMContentLoaded', function() {
            const markers = document.querySelectorAll('.location-marker');
            markers.forEach(marker => {
                marker.addEventListener('click', function() {
                    const title = this.getAttribute('title');
                    alert('📍 ' + title + '\n\nClick on any location to learn more about the economic centers and transportation routes in Sri Lanka.');
                });
            });
        });

        document.addEventListener("DOMContentLoaded", function () {
            map = L.map('map').setView([7.8731, 80.7718], 8);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map); 

            // Distance Calculator Event Listeners
            document.getElementById("routeCalcOption").addEventListener("click", function() {
                resetCalculator();
                calcMode = 'route';
                this.classList.add('active');
                document.getElementById('calcStatus').textContent = 'Click two points on the map to calculate route';
            });

            document.getElementById("nearestCentersOption").addEventListener("click", function() {
                resetCalculator();
                calcMode = 'nearest';
                this.classList.add('active');
                document.getElementById('calcStatus').textContent = 'Click on the map to find nearest economic centers';
            });

            document.getElementById("clearCalcBtn").addEventListener("click", function() {
                clearCalculatorElements();
                if (calcMode === 'route') {
                    document.getElementById('calcStatus').textContent = 'Click two points on the map to calculate route';
                } else if (calcMode === 'nearest') {
                    document.getElementById('calcStatus').textContent = 'Click on the map to find nearest economic centers';
                }
            });

            document.getElementById("resetCalcBtn").addEventListener("click", resetCalculator);

            // Map click handler for distance calculator
            map.on('click', function(e) {
                if (calcMode === 'route') {
                    if (calcPoints.length < 2) {
                        calcPoints.push({ lat: e.latlng.lat, lng: e.latlng.lng });
                        
                        const marker = L.marker([e.latlng.lat, e.latlng.lng], {
                            icon: L.icon({
                                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                                iconSize: [25, 41],
                                iconAnchor: [12, 41]
                            })
                        }).addTo(map);
                        
                        calcMarkers.push(marker);
                        
                        if (calcPoints.length === 1) {
                            document.getElementById('calcStatus').textContent = 'Click second point on the map';
                        } else if (calcPoints.length === 2) {
                            document.getElementById('calcStatus').textContent = 'Calculating route...';
                            calculateRouteDistance(calcPoints[0], calcPoints[1]).then(() => {
                                document.getElementById('calcStatus').textContent = 'Route calculated! Click Clear to start over';
                            });
                        }
                    }
                } else if (calcMode === 'nearest') {
                    clearCalculatorElements();
                    
                    const marker = L.marker([e.latlng.lat, e.latlng.lng], {
                        icon: L.icon({
                            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-red.png',
                            iconSize: [25, 41],
                            iconAnchor: [12, 41]
                        })
                    }).addTo(map);
                    
                    calcMarkers.push(marker);
                    
                    document.getElementById('calcStatus').textContent = 'Finding nearest centers...';
                    findNearestCenters({ lat: e.latlng.lat, lng: e.latlng.lng }).then(() => {
                        document.getElementById('calcStatus').textContent = '3 nearest centers found!';
                    });
                }
            });
        });

        // Farm location selection
        document.getElementById("getLocationBtn").addEventListener("click", () => {
            alert("Click on the map to select the crop origin location.");

            map.once('click', async function (e) {
                const lat = e.latlng.lat.toFixed(6);
                const lng = e.latlng.lng.toFixed(6);

                if (selectedMarker) {
                    map.removeLayer(selectedMarker);
                }

                selectedMarker = L.marker([lat, lng]).addTo(map).bindPopup("Crop Origin").openPopup();

                document.getElementById("latitude").value = lat;
                document.getElementById("longitude").value = lng;

                const district = await getDistrictFromCoordinates(lat, lng);
                document.getElementById("district").value = district || "Unknown";
                document.getElementById("locationStatus").innerText = `📍 Location selected: ${district || "Unknown"} (${lat}, ${lng})`;
            });
        });

        async function getDistrictFromCoordinates(lat, lng) {
            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
            try {
                const response = await fetch(url);
                const data = await response.json();
                return data.address.county || data.address.state_district || data.address.district || data.address.city || "Unknown";
            } catch (error) {
                console.error("Reverse geocoding failed:", error);
                return "Unknown";
            }
        }

        document.getElementById("clearLocationBtn").addEventListener("click", () => {
            if (selectedMarker) {
                map.removeLayer(selectedMarker);
                selectedMarker = null;
            }
            
            if (routeLayer) {
                map.removeLayer(routeLayer);
                routeLayer = null;
            }
            
            document.getElementById("latitude").value = "";
            document.getElementById("longitude").value = "";
            document.getElementById("district").value = "";
            document.getElementById("locationStatus").innerText = "No location selected.";
        });

        document.getElementById("resetbtn").addEventListener("click", () => {
            const form = document.getElementById("mainform");
            form.reset();

            const otherInputs = document.querySelectorAll(".other-input");
            otherInputs.forEach(input => {
                input.classList.add("hidden");
                input.removeAttribute("required");
                input.value = "";
            });
            
            if (selectedMarker) {
                map.removeLayer(selectedMarker);
                selectedMarker = null;
            }

            if (routeLayer) {
                map.removeLayer(routeLayer);
                routeLayer = null;
            }

            document.getElementById("latitude").value = "";
            document.getElementById("longitude").value = "";
            document.getElementById("district").value = "";
            document.getElementById("locationStatus").innerText = "No location selected.";
        });

        const sheetDataURL = "https://script.google.com/macros/s/AKfycbza3T-W3IZzyyS5XBLEQawxpKb_nmF2Y4gX7j-x7K1mDwONLdOPHJMh8WRwc8kZL8AZ/exec";

        async function loadSurveyData() {
            document.getElementById('statsLoader').classList.remove('hidden');
            try {
                const response = await fetch(sheetDataURL);
                const data = await response.json();
                
                window.serverData = data;
                const allData = [...data, ...localSubmissions];

                document.getElementById("stat-responses").innerHTML = `<strong>📊 Responses: ${allData.length}</strong>`;

                const cropCounts = {};
                allData.forEach(r => {
                    const crop = r["Main product you transport"];
                    if (crop) {
                        cropCounts[crop] = (cropCounts[crop] || 0) + 1;
                    }
                });

                const maxCount = Math.max(...Object.values(cropCounts));
                const topCrops = Object.entries(cropCounts)
                    .filter(([crop, count]) => count === maxCount)
                    .map(([crop]) => crop);

                document.getElementById("stat-maincrop").innerText = `${topCrops.join(", ")}`;

                const markets = allData.map(r => r["Usual selling place (Economic Center or Market)"]);
                const topMarket = getMostCommonValue(markets);
                document.getElementById("stat-topmarket").innerText = `${topMarket}`;

                const targetCrops = ["Vegetables", "Rice", "Dairy", "Fruits", "Other"];
                const cropDistrictCount = {};

                allData.forEach(r => {
                    const crop = r["Main product you transport"];
                    const district = r["Farm location (district)"];
                    if (crop && district && targetCrops.includes(crop)) {
                        if (!cropDistrictCount[crop]) cropDistrictCount[crop] = {};
                        cropDistrictCount[crop][district] = (cropDistrictCount[crop][district] || 0) + 1;
                    }
                });

                const cropDistrictSummary = targetCrops.map(crop => {
                    if (cropDistrictCount[crop]) {
                        const topDistrict = Object.entries(cropDistrictCount[crop])
                            .reduce((a, b) => a[1] > b[1] ? a : b)[0];
                        return `${crop} from: ${topDistrict}`;
                    } else {
                        return `${crop}: None`;
                    }
                }).join("<br>");

                document.getElementById("stat-topdistrict").innerHTML = cropDistrictSummary;

                const allowedProblems = [
                    "Bad roads", "High fuel cost", "No vehicle", "Long distance", "No Problems", "Other"
                ];

                const emojiMap = {
                    "Bad roads": "🛣️",
                    "High fuel cost": "⛽",
                    "No vehicle": "🚫",
                    "Long distance": "📏",
                    "No Problems": "❌",
                    "Other": "❓"
                };

                const problemCounts = {};
                allData.forEach(r => {
                    const problems = (r["Problems you face in transportation"] || "").split(",").map(p => p.trim());
                    problems.forEach(p => {
                        if (p) problemCounts[p] = (problemCounts[p] || 0) + 1;
                    });
                });

                const filteredLines = allowedProblems.map(p => {
                    const emoji = emojiMap[p] || "";
                    const count = problemCounts[p] || 0;
                    return `${emoji} ${p} (${count})`;
                }).join("<br>");
                const ctx = document.getElementById("transportIssuesChart").getContext("2d");
                if (window.transportChart) {
                    window.transportChart.destroy();
                }
                window.transportChart = new Chart(ctx, {
                    type: "doughnut",
                    data: {
                        labels: allowedProblems,
                        datasets: [{
                            data: allowedProblems.map(p => problemCounts[p] || 0),
                            backgroundColor: ["#f44336", "#ff9800", "#9c27b0", "#03a9f4", "#4caf50", "#607d8b"],
                            borderWidth: 1
                        }]
                    },
                    options: {
                        cutout: '70%',
                        plugins: {
                            legend: {
                                display: true,
                                position: 'bottom'
                            }
                        }
                    }
                });

                const allProblemLines = Object.entries(problemCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([p, count]) => `• ${p} (${count})`)
                    .join("<br>");

                document.getElementById("allTransportIssuesList").innerHTML = allProblemLines;

                data.forEach(row => {
                    const lat = parseFloat(row["latitude"]);
                    const lng = parseFloat(row["longitude"]);
                    if (!isNaN(lat) && !isNaN(lng)) {
                        const popupText = `
                            <strong>🚜 ${row["Main role"] || "Unknown"}</strong><br>
                            📍 ${row["Farm location (district)"] || "Unknown"}<br>
                            🛒 ${row["Usual selling place (Economic Center or Market)"] || "Unknown"}<br>
                            🌾 ${row["Main product you transport"] || "Unknown"}<br>
                            🚛 ${row["Type of vehicle used for transport"] || "Unknown"}<br>
                            📦 ${row["Items you bring back after selling"] || "Unknown"}<br>
                            ⏱️ ${row["Market visit frequency"] || "Unknown"}<br>
                            💬 ${row["Suggestions or comments (optional)"] || "None"}
                        `;
                        L.circleMarker([lat, lng], { radius: 5, color: 'blue' })
                            .addTo(map)
                            .bindPopup(popupText);
                    }
                });

                centers.forEach(center => {
                    let iconUrl = "https://cdn-icons-png.flaticon.com/512/1233/1233265.png";

                    if (center.name.includes("Dedicated")) {
                        iconUrl = "https://cdn-icons-png.flaticon.com/512/7511/7511667.png";
                    }

                    const icon = L.icon({
                        iconUrl: iconUrl,
                        iconSize: [30, 30],
                        iconAnchor: [15, 30],
                        popupAnchor: [0, -30]
                    });

                    const marketData = allData.filter(d => d["Usual selling place (Economic Center or Market)"] === center.name);
                    const total = marketData.length;

                    const cropCounts = {};
                    const districtCounts = {};
                    marketData.forEach(entry => {
                        const crop = entry["Main product you transport"];
                        const district = entry["Farm location (district)"];
                        if (crop) cropCounts[crop] = (cropCounts[crop] || 0) + 1;
                        if (district) districtCounts[district] = (districtCounts[district] || 0) + 1;
                    });

                    const cropList = Object.keys(cropCounts).join(", ") || "None";
                    const topDistrict = Object.entries(districtCounts)
                        .reduce((a, b) => a[1] > b[1] ? a : b, ["None", 0])[0];

                    const popupHTML = `
                        <strong>🏪 ${center.name}</strong><br>
                        📊 Total Entries: ${total}<br>
                        🌾 Crops: ${cropList}<br>
                        📍 Top Origin District: ${topDistrict}
                    `;

                    L.marker(center.coords, { icon }).addTo(map)
                        .bindPopup(popupHTML);
                });

            } catch (error) {
                console.error("Failed to load data:", error);
            } finally {
                document.getElementById('statsLoader').classList.add('hidden');
            }
        }

        function getMostCommonValue(arr) {
            const counts = {};
            arr.forEach(val => {
                if (val) counts[val] = (counts[val] || 0) + 1;
            });
            return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, "None");
        }

        document.addEventListener('DOMContentLoaded', loadSurveyData);

        document.addEventListener("DOMContentLoaded", function () {
            const showBtn = document.getElementById("showMoreIssuesBtn");
            const modal = document.getElementById("issueModal");
            const closeBtn = document.getElementById("closeModal");

            showBtn.addEventListener("click", () => {
                modal.classList.remove("hidden");
            });

            closeBtn.addEventListener("click", () => {
                modal.classList.add("hidden");
            });

            modal.addEventListener("click", (e) => {
                if (e.target === modal) {
                    modal.classList.add("hidden");
                }
            });
        });