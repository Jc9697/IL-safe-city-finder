async function geolocate() {
  await getCoordinates();

  async function getCoordinates() {
    let message = document.getElementById("message");
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log(position);
          const userLongitude = position.coords.longitude;
          const userLatitude = position.coords.latitude;
          start = [userLongitude, userLatitude];

          const cityElement = document
            .getElementById("city")
            .textContent.split(",");
          const city = cityElement[0];
          const state = cityElement[1];
          randomCityCoordinates();

          async function randomCityCoordinates() {
            try {
              const response = await fetch(
                `https://api.mapbox.com/search/geocode/v6/forward?access_token=pk.eyJ1IjoiamM5Njk3IiwiYSI6ImNtZmU4emtteDA0OWsycXB4NzdoZHhhNG4ifQ.tosOkW-tBFJcGKJM0x7tFg&place=${city}&region=${state}`
              );

              if (!response.ok) {
                message = `An error has occured: ${response.status}`;
                throw new Error(message);
              } else {
                const data = await response.json();
                const randomCityLongitude =
                  data.features[0].geometry.coordinates[0];
                const randomCityLatitude =
                  data.features[0].geometry.coordinates[1];
                map.on("load", () => {
                  const defaultEnd = [randomCityLongitude, randomCityLatitude];
                  // add origin circle to the map

                  map.addLayer({
                    id: "origin-circle",
                    type: "circle",
                    source: {
                      type: "geojson",
                      data: {
                        type: "FeatureCollection",
                        features: [
                          {
                            type: "Feature",
                            properties: {},
                            geometry: {
                              type: "Point",
                              coordinates: start,
                            },
                          },
                        ],
                      },
                    },
                    paint: {
                      "circle-radius": 10,
                      "circle-color": "#4ce05b",
                    },
                  });

                  // add destination circle to the map
                  map.addLayer({
                    id: "destination-circle",
                    type: "circle",
                    source: {
                      type: "geojson",
                      data: {
                        type: "FeatureCollection",
                        features: [
                          {
                            type: "Feature",
                            properties: {},
                            geometry: {
                              type: "Point",
                              coordinates: defaultEnd,
                            },
                          },
                        ],
                      },
                    },
                    paint: {
                      "circle-radius": 10,
                      "circle-color": "#f30",
                    },
                  });

                  // make an initial directions request on load
                  getRoute(defaultEnd);
                });
              }
            } catch (err) {
              console.error(err);
            }
          }
        },
        (err) => {
          message.textContent = "User denied geolocation";
          console.error(err);
        }
      );
    }
  }
}

geolocate();

let start = [];

mapboxgl.accessToken =
  "pk.eyJ1IjoiamM5Njk3IiwiYSI6ImNtZmU4emtteDA0OWsycXB4NzdoZHhhNG4ifQ.tosOkW-tBFJcGKJM0x7tFg";
const map = new mapboxgl.Map({
  container: "map", // container id
  style: "mapbox://styles/mapbox/streets-v12", // map style
  center: [-89.290635, 40.323865], // starting position
  zoom: 5.5,
});

// create a function to make a directions request and update the destination
async function getRoute(end) {
  const query = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`
  );
  const json = await query.json();
  const data = json.routes[0];
  const route = data.geometry;
  const geojson = {
    type: "Feature",
    properties: {},
    geometry: route,
  };

  if (map.getSource("route")) {
    // if the route already exists on the map, reset it using setData
    map.getSource("route").setData(geojson);
  }

  // otherwise, add a new layer using this data
  else {
    map.addLayer({
      id: "route",
      type: "line",
      source: {
        type: "geojson",
        data: geojson,
      },
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "#3887be",
        "line-width": 5,
        "line-opacity": 0.75,
      },
    });
  }
}
