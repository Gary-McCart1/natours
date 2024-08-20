/* eslint-disable */
import axios from 'axios';
import {showAlert} from "./alerts"
const stripe = Stripe(
  pk_test_51PpxeXCsmvZLQysRX5aeYGKaORVlE2nVgGWxKrmTXgtXZoeFAPvuHOnpCxgujGlXRDnxvUBQqoHUXEIBaX59hm4v00PuMzcrxW
);

export const bookTour = async tourId => {
    try{
        const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`)

        await stripe.redirectToCheckout({
            sessionid: session.data.ession.id
        })
    }catch(err){
        console.log(err);
        showAlert('error', err)
    }

}
