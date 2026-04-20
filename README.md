Main Hexlink app

# First time set up

## Requirements
- Docker

## Instructions
- To create local active tiles files:
    - Go to https://h3geo.org and select the tiles you wish to be active; default in the project is resolution 8 tiles. Those are quite small, so if you want to select a large area can select using a larger resolution and use h3's `cellToChildren(cell, 8)` to get the cells of the correct resolution. You'll need to manually clean up later as it's likely it will have undesired stuff at the edges
    - Save the res 8 cells IDs in a comma separated file (e.g. `8819484001fffff,8819484003fffff,8819484005fffff,...`) and put it somewhere in the `/public` folder, e.g. `/public/resources`
    - Also zip the file and put it in the same folder
    - Create a `.env` file from the template and fill in the locations e.g.
    ```
    VITE_ACTIVE_TILE_FILE_LOCATION=/resources/your_file.zip
    VITE_ACTIVE_TILE_FILE=your_file.txt
    ```
- Update the min and max latitudes and longitudes in `\backend\prisma\seed.ts` to be in your desired defined area for correct seeding
- Create and populate the `.env` files from the templates in root and `/backend` 
- Open the dev container. It should install everything automatically and run 2 containers - 1 for your DB and one for node apps. It will also seed the DB

# Running (inside the dev container)
- Backend:
    - `cd backend`
    - `npm run backend`

- Frontend: `npm start`

# Deployment
You will need to run this if you create any new lambdas
- Install terraform 
- Install AWS CLI
- Zip `/backend/lamdba` and put it in `/terraform`
- To log in and run `terraform apply`, run `.\terraform\terraform_apply.sh` 

