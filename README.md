# Balancer Minimal UI
This project is a minimal frontend for the [Balancer V2](https://balancer.fi/) protocol.

See a [demo site](https://balancer-minimal-ui-whve.vercel.app/).

## Run the app in the development mode

1. Install dependencies :  
`npm install`

2. Create a `./.env.local` file and set your RPC keys in the variables :    
`REACT_APP_INFURA=`  
`REACT_APP_ALCHEMY_POLYGON=`  
`REACT_APP_ALCHEMY_ARBITRUM=`  

3. Runs the development server :  
`npm start`

4. Open [http://localhost:3000](http://localhost:3000/) to view the app in the browser.

## Deploy the app in production

1. Install dependencies :  
`npm install`

2. Create a `./.env.local` file and set your RPC keys in the variables :    
`REACT_APP_INFURA=`  
`REACT_APP_ALCHEMY_POLYGON=`  
`REACT_APP_ALCHEMY_ARBITRUM=`  

3. Builds the app for production :  
`npm run build`

This creates a `build` directory with a production build of your app. Set up your favorite HTTP server so that a visitor to your site is served `index.html`.
