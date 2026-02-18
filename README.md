Main Hexlink app

# First time set up

## Requirements
- Node
- Docker

- `npm i`
- To create local active tiles files:
    - Go to https://h3geo.org and select the tiles you wish to be active; default in the project is resolution 8 tiles. Those are quite small, so if you want to select a large area can select using a larger resolution and use h3's `cellToChildren(cell, 8)` to get the cells of the correct resolution. You'll need to manually clean up later as it's likely it will have undesired stuff at the edges
    - Save the res 8 cells IDs in a comma separated file (e.g. `8819484001fffff,8819484003fffff,8819484005fffff,...`) and put it somewhere in the `/public` folder, e.g. `/public/resources`
    - Also zip the file and put it in the same folder
    - Create a `.env` file from the template and fill in the locations e.g.
    ```
    REACT_APP_ACTIVE_TILE_FILE_LOCATION=/resources/your_file.zip
    REACT_APP_ACTIVE_TILE_FILE=your_file.txt
    ```
- Database setup
    - Run `docker compose up`
    - Add the connection string of your db to `/prisma/.env` `DATABASE_URL` var - for the given docker-compose should be
    ```
    DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hexlink?schema=public"
    ```
    - Run migrations with `npx prisma migrate dev --name init`
    - Optional: download a Potgres viewer and connect to it to see the tables


# Running 
- `docker compose up` (database)
- `npm start`