Main Hexlink app

# First time set up

## Requirements
- Docker

## Instructions
- Create and populate the `.env` files from the templates in root and `/backend` // TODO backend will be replaced by sam local invoke
- Open the dev container. It should install everything automatically and run 2 containers - 1 for your DB and one for node apps. It will also seed the DB
- To create local active tiles files:
    // TODO make a util for this
    - Go to https://h3geo.org and select the tiles you wish to be active; default in the project is resolution 8 tiles. Those are quite small, so if you want to select a large area can select using a larger resolution and use h3's `cellToChildren(cell, 8)` to get the cells of the correct resolution. You'll need to manually clean up later as it's likely it will have undesired stuff at the edges
    - Save the res 8 cells IDs in a comma separated file (e.g. `8819484001fffff,8819484003fffff,8819484005fffff,...`) and put it in the `utils` folder
    - Update the min and max latitudes and longitudes in `utils\generateGrid.ts` to define your desired defined area. Run the script with `npm run tiles:grid` - this will generate a layer for the background, separating active tiles from your comma separated file from background tiles that aren't in use
        - This takes a while and it is recommended to run it outside of docker so that max power can be used. If using WSL you might need to update the limits using `.wslconfig`. Either way it can still take a while to generate
    - Update the file name in `utils\generateCounts.ts` to match your comma separate file name and run 
        ```
        npm i dotenv (please don't commit this to the repo)
        npm run tile:counts
        ``` 
        this will get the counts from the DB and create a map layer with your communities
    - Update the bounds in `hooks\useMapOverlay.tsx` to match those you defined in `utils\generateGrid.ts` when generating the map


# Running (inside the dev container)
- Backend:
    - `cd backend`
    - `npm run backend`

- Frontend: `npm start`

# Deployment
You will need to run this if you create any new lambdas
- Install terraform 
- Install AWS CLI
- Go to `\backend` and run `npm run build` to build your lambda files
- Zip `/backend/dist/lamdba` and put it in `/terraform`
- To log in and run `terraform apply`, run `.\terraform\terraform_apply.sh` 

## First time deployment
- Upload the `h3-grid.pmtiles` you generated earlier manually to S3 in the `/tiles` folder. `h3-counts.pmtiles` will run automatically from GitHub actions 

# Databases

Every command has to be run from `/backend`
- `npm run db:seed` - should run automatically when you create your Docker container to populate the DB with some sample data. You can also run it whenever you want
- `npm run db:generate <migration_name>` - generates the migration and puts it in `/migrations`
- `npm run db:migrate` - applies the migrations to the DB
- `npm run db:studio` - start a DB management tool you can open in the browser to view the tables

