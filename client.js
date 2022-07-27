'use strict';

const {Client, HazelcastJsonValue} = require('hazelcast-client');

async function mapExample(client){
    const cities = await client.getMap('cities');
    await cities.put(1, new HazelcastJsonValue(JSON.stringify({ country: "United Kingdom", city: "London", population: 9_540_576})));
    await cities.put(2, new HazelcastJsonValue(JSON.stringify({ country: "United Kingdom", city: "Manchester", population: 2_770_434})));
    await cities.put(3, new HazelcastJsonValue(JSON.stringify({ country: "United States", city: "New York", population: 19_223_191})));
    await cities.put(4, new HazelcastJsonValue(JSON.stringify({ country: "United States", city: "Los Angeles", population: 3_985_520})));
    await cities.put(5, new HazelcastJsonValue(JSON.stringify({ country: "Turkey", city: "Ankara", population: 5_309_690})));
    await cities.put(6, new HazelcastJsonValue(JSON.stringify({ country: "Turkey", city: "Istanbul", population: 15_636_243})));
    await cities.put(7, new HazelcastJsonValue(JSON.stringify({ country: "Brazil", city: "Sao Paulo", population: 22_429_800})));
    await cities.put(8, new HazelcastJsonValue(JSON.stringify({ country: "Brazil", city: "Rio de Janeiro", population: 13_635_274})));

    const mapSize = await cities.size();
    console.log(`'cities' map now contains ${mapSize} entries.`);

    console.log("--------------------");
}

async function sqlExample(hzClient) {
    await createMappingForCapitals(hzClient);

    await clearCapitals(hzClient);

    await populateCapitals(hzClient);

    await selectAllCapitals(hzClient);

    await selectCapitalNames(hzClient);

    process.exit(0);
}

async function createMappingForCapitals(client){
    console.log("Creating a mapping...");
    // See: https://docs.hazelcast.com/hazelcast/5.0/sql/mapping-to-maps
    const mappingQuery = `
        CREATE OR REPLACE MAPPING cities TYPE IMap 
        OPTIONS(
            'keyFormat'='varchar',
            'valueFormat'='varchar'
        );`;
    await client.getSql().execute(mappingQuery);
    console.log("The mapping has been created successfully.");
    console.log("--------------------");
}

async function clearCapitals(client){
    console.log("Deleting data via SQL...");
    const deleteQuery = "DELETE FROM cities";
    await client.getSql().execute(deleteQuery);
    console.log("The data has been deleted successfully.");
    console.log("--------------------");
}

async function populateCapitals(client){
    console.log("Inserting data via SQL...");
    const insertQuery = `
        INSERT INTO cities
        VALUES ('Australia', 'Canberra'),
               ('Croatia', 'Zagreb'),
               ('Czech Republic', 'Prague'),
               ('England', 'London'),
               ('Turkey', 'Ankara'),
               ('United States', 'Washington, DC');`;
    await client.getSql().execute(insertQuery);
    console.log("The data has been inserted successfully.");
    console.log("--------------------");
}

async function selectAllCapitals(client){
    console.log("Retrieving all the data via SQL...");
    const sqlResultAll = await client.getSql()
        .execute("SELECT * FROM cities", [], {returnRawResult: true});
    for await (const row of sqlResultAll) {
        const country = row.getObject(0);
        const city = row.getObject(1);
        console.log(`${country} - ${city}`);
    }
    console.log("--------------------");
}

async function selectCapitalNames(client){
    console.log("Retrieving a city name via SQL...");
    const sqlResultRecord = await client.getSql()
        .execute("SELECT __key AS country, this AS city FROM cities WHERE __key = ?", ["United States"]);
    for await (const row of sqlResultRecord) {
        const country = row.country;
        const city = row.city;
        console.log(`Country name: ${country}; City name: ${city}`);
    }
    console.log("--------------------");
}

async function jsonSerializationExample(hzClient) {
    await createMappingForCountries(hzClient);

    await populateCountriesMap(hzClient);

    await selectAllCountries(hzClient);

    await createMappingForCities(hzClient);

    await populateCityMap(hzClient);

    await selectCitiesByCountry(hzClient, "AU");

    await selectCountriesAndCities(hzClient);

    process.exit(0);
}

async function createMappingForCountries(hzClient) {
    // see: https://docs.hazelcast.com/hazelcast/5.0/sql/mapping-to-maps#json-objects
    console.log("Creating mapping for countries...");

    const mappingQuery = `
        CREATE OR REPLACE MAPPING country(
            __key VARCHAR, 
            isoCode VARCHAR, 
            country VARCHAR
        )
        TYPE IMap OPTIONS(
            'keyFormat' = 'varchar',
            'valueFormat' = 'json-flat'
        );`;

    await hzClient.getSql().execute(mappingQuery);
    console.log("Mapping for countries has been created.");
    console.log("--------------------");
}

async function populateCountriesMap(hzClient) {
    // see: https://docs.hazelcast.com/hazelcast/5.0/data-structures/creating-a-map#writing-json-to-a-map
    console.log("Populating 'countries' map with JSON values...");

    const countries = await hzClient.getMap("country");
    await countries.set("AU", {"isoCode": "AU", "country": "Australia"});
    await countries.set("EN", {"isoCode": "EN", "country": "England"});
    await countries.set("US", {"isoCode": "US", "country": "United States"});
    await countries.set("CZ", {"isoCode": "CZ", "country": "Czech Republic"});
    console.log("The 'countries' map has been populated.");
    console.log("--------------------");
}

async function selectAllCountries(hzClient) {
    const query = "SELECT c.country from country c";
    console.log("Select all countries with sql = " + query);

    const sqlResult = await hzClient.getSql().execute(query);
    for await (const row of sqlResult) {
        console.log(`country = ${row.country}`);
    }
    console.log("--------------------");
}

async function createMappingForCities(hzClient) {
    //see: https://docs.hazelcast.com/hazelcast/5.0/sql/mapping-to-maps#json-objects
    console.log("Creating mapping for cities...");

    const mappingQuery = `
        CREATE OR REPLACE MAPPING city(
            __key INT, 
            country VARCHAR, 
            city VARCHAR, 
            population BIGINT
        ) 
        TYPE IMap OPTIONS (
            'keyFormat' = 'int',
            'valueFormat' = 'json-flat'
        );`;

    await hzClient.getSql().execute(mappingQuery);
    console.log("Mapping for cities has been created.");
    console.log("--------------------");
}

async function populateCityMap(hzClient) {
    // see: https://docs.hazelcast.com/hazelcast/5.0/data-structures/creating-a-map#writing-json-to-a-map
    console.log("Populating 'city' map with JSON values...");

    const cities = await hzClient.getMap("city");
    cities.set(1, {"country": "AU", "city": "Canberra", "population": 354644});
    cities.set(2, {"country": "CZ", "city": "Prague", "population": 1227332});
    cities.set(3, {"country": "EN", "city": "London", "population": 8174100});
    cities.set(4, {"country": "US", "city": "Washington, DC", "population": 601723});
    console.log("The 'city' map has been populated.");
    console.log("--------------------");
}

async function selectCitiesByCountry(hzClient, country) {
    const query = "SELECT city, population FROM city where country=?";
    console.log("Select city and population with sql = " + query);

    const sqlResult = await hzClient.getSql().execute(query, [country]);
    for await (const row of sqlResult) {
        console.log(`city = ${row.city}, population = ${row.population}`);
    }
    console.log("--------------------");
}

async function selectCountriesAndCities(hzClient) {
    const query = `
        SELECT c.isoCode, c.country, t.city, t.population
        FROM country c
        JOIN city t
        ON c.isoCode = t.country`;
    console.log("Select country and city data in query that joins tables");

    let rows = [];
    const sqlResult = await hzClient.getSql().execute(query);
    for await (const row of sqlResult) {
        rows.push({
            "iso": row.isoCode,
            "country": row.country,
            "city": row.city,
            "population": parseInt(row.population)
        });
    }
    console.table(rows);
    console.log("--------------------");
}

//
//   This example shows how to work with Hazelcast maps, where the map is
//   updated continuously.
//
//   @param client - a {@link HazelcastInstance} client.
//
async function nonStopMapExample(client) {
    console.log("Now, `map` will be filled with random entries.");
    const map = await client.getMap('map');

    let iterationCounter = 0;
    while (true) {
        const randomKey = Math.floor(Math.random() * 100000);
        await map.put('key' + randomKey, 'value' + randomKey);
        await map.get('key' + Math.floor(Math.random() * 100000))
        if (++iterationCounter === 10) {
            iterationCounter = 0;
            const size = await map.size();
            console.log(`Current map size: ${size}`);
        }
    }
}

(async () => {
    try {
        const client = await Client.newHazelcastClient(
            {
                network: {
                    hazelcastCloud: {
                        discoveryToken: 'YOUR_DISCOVERY_TOKEN'
                    }
                },
                clusterName: 'YOUR_CLUSTER_NAME'
            }
        );
        console.log("Connection Successful!");

        // await mapExample(client);

        await sqlExample(client);

        // await jsonSerializationExample(client);

        // await nonStopMapExample(client)

        client.shutdown();
    } catch (err) {
        console.error('Error occurred:', err);
    }
})();