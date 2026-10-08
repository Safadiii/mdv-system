import {useEffect,useState} from "react";
import {getProducts} from "../api/product";


export function useProducts(){

    const [products,setProducts]=useState([]);


    useEffect(()=>{

        async function load(){
            const data = await getProducts();
            setProducts(data);
        }

        load();

    },[]);


    return {
        products
    };
}