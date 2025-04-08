const express=require('express');
const app =express();
const mongoose = require('mongoose');
const {User} = require('./model/User');
const morgan =require('morgan');
const cors= require('cors');
const bcrypt =require('bcryptjs');
const jwt =require('jsonwebtoken');
const {Product}= require('./model/Product');
const {Cart}=require('./model/Cart');


//middleware
app.use(cors());
app.use(morgan('dev'))
app.use(express.json());

mongoose.connect('mongodb+srv://chougulepriyanka36:TiRvcmOHsQB7tAnh@cluster0.oe8k1zj.mongodb.net/?retryWrites=true&w=majority')
.then(()=>{
    console.log("db is connected")
}).catch((error)=>{
    console.log("db is not connected",error)
})

//task-1 create route for register user
app.post('/register',async(req,res)=>{
    try{
        let {name,email,password}= req.body;

        //check if any field missing
        if(!email || !name || !password){
            res.status(400).json({
                message:"Field is missing"
            })
        }
        //check if user allready have account
        const user= await User.findOne({email});

        if(user){
            return res.status(400).json({
                message: "User already has a account"
            })
        }else{

            //hash the password -> secure password
            const salt =bcrypt.genSaltSync(10);
            const hashedPassword = bcrypt.hashSync(password,salt);

            //user authentication
            const token = jwt.sign({email},"supersecret",{expiresIn:'365d'});

            //create user in database 
            await User.create({
                name,
                password : hashedPassword,
                email,
                token,
                role:'user'
            })

            return res.status(200).json({
                message:"User created successfully"
            })
        }
    }
    catch(eroor){
         console.log(eroor);
         res.status(400).json({
            message:"Internal server error"
         })
    }
})
//task-2 create route for login
app.post('/login',async(req,res)=>{
    try{
       let{email,password}=req.body;

       //check all fields are there are not
       if(!email || !password){
            return res.status(400).json({
                message:"Field is missing"
            })
       }
       //checking user having account 
       const user=await User.findOne({email});

       if(!user){
        return res.status(400).json({
            message:"User not registered"
        })
       }
       //compare password with the stored password
       const  isPasswordMatched = bcrypt.compareSync(password,user.password)

       if(!isPasswordMatched){
           return res.status(404).json({
              message:"Password is wrong"
           })
       }

       return res.status(200).json({
           message:"User loged in successfully",
           id:user._id,
           name:user.name,
           token:user.token,
           email:user.email,
           role:user.role
       })

    }
    catch(eroor){
        console.log(eroor);
        res.status(400).json({
           message:"Internal server error"
        })
    }
})

//task-3 create route to see all product
app.get('/products',async(req,res)=>{
    try{
        
        const products = await Product.find();
        res.status(200).json({
            message: "Product found seccussfully",
            products:products
        })
    }
    catch(eroor){
        console.log(eroor);
        res.status(400).json({
           message:"Internal server error"
        })
    }
}) 

//tasck-4 create route to add product
app.post('/add-product',async(req,res)=>{
    try{
          let {name, image, description, stock, brand, price}=req.body;
          const {token} =req.headers;
          const decodedToken = jwt.verify(token, "supersecret");
          const user = await User.findOneAndReplace({email: decodedToken.email})
          const product = await Product.create({
            name,
            stock,
            price,
            image,
            brand,
            description,
            user: user._id
          })
          return res.status(200).json({
            message: "Product created successfully",
            product:product
          })
    }
    catch(eroor){
        console.log(eroor);
        res.status(400).json({
           message:"Internal server error"
        })
    }
})

app.post('/add-product', async (req, res) => {
    try {
        let { name, image, description, stock, brand, price } = req.body;
        const { token } = req.headers;

        // Verify the token
        const decodedToken = jwt.verify(token, "supersecret");

        // Find the user by email
        const user = await User.findOne({ email: decodedToken.email });

        // Check if the user is found
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Create the new product
        const product = await Product.create({
            name,
            stock,
            price,
            image,
            brand,
            description,
            user: user._id // Add the user's _id as a reference
        });

        return res.status(200).json({
            message: "Product created successfully",
            product: product
        });
    } catch (error) {
        console.log(error);
        res.status(400).json({
            message: "Internal server error"
        });
    }
});

//task-5 create rout to see particular product
app.post('/product/:id',async(req,res)=>{
    try{
          let {id} = req.params;
          if(!id){
            return res.status(400).json({
                message:"Product id not found"
            })
          }
          let {token} = req.headers;
          const decodedToken = jwt.verify(token, "supersecret");
          if(decodedToken.email){
            const product = await Product.findById(id);

            if(!product){
                res.status(400).json({
                    message:"Product not found"
                })
            }
            return res.status(200).json({
                message:"Product found successfully",
                product
            })
          }
    }
    catch(eroor){
        console.log(eroor);
        res.status(400).json({
           message:"Internal server error"
        })
    }
})

// //task-6 create route to update product
app.patch('/product/edit/:id',async(req,res)=>{
    
         const {id}=req.params;
         const {name, image, stock, brand, description, price}=req.body.productData;
         const {token}= req.headers;
         const decodedToken = jwt.verify(token,"supersecret");
         try{
         if(decodedToken.email){
            const updatedproduct=await Product.findByIdAndUpdate(id,{
                name,
                brand,
                description,
                image,
                price,
                stock
            });
            return res.status(200).json({
                message: "Product update successfully",
                product:updatedproduct
            })
         }
    }
    catch(eroor){
        console.log(eroor);
        res.status(400).json({
           message:"Internal server error"
        });
    }
})

//task-7 create route to delete product
app.delete('/product/delete/:id',async(req,res)=>{
    try{
       let {id} = req.params;
       if(!id){
        return res.status(400).json({
            message:"id not found"
        })
       }
       let deletedProduct = await Product.findByIdAndDelete(id);
       if(!deletedProduct){
        return res.status(400).json({
            message:"Product not found"
        })
       }
       return res.status(200).json({
        message:"Product deleted successfully",
        product:deletedProduct
       })

    } catch(eroor){
        console.log(eroor);
        res.status(400).json({
           message:"Internal server error"
        });
    }
}) 

//task-8 create route to see all product in cart
app.get('/cart', async(req,res)=>{
    try{
       let {token}=req.headers;
       const decodedToken = jwt.verify(token,"supersecret")
       const user = await User.findOne({email:decodedToken.email}).populate({
          path: 'cart',
          populate:{
            path:'products',
            model:'Product'
          }
       })
       if(!user){
        return res.status(400).json({
            message:"User not found"
        })
       }
       return res.status(200).json({
        cart: user.cart
       })
    }
    catch(eroor){
            console.log(eroor);
            res.status(400).json({
               message:"Internal server error"
            });
        }
})

//task-9 create route to add product in cart
app.post('/cart/add',async(req,res)=>{
    try{
         const body=req.body;
         //getting product id from frontend
         const productArray = body.products;
         let totalPrice =0;

         //find the product and add product price in total
         for(let item of productArray){
            const product = await Product.findById(item);
            if(product){
                totalPrice += product.price;

            }
         }
         const {token}=req.headers;
         const decodedToken = jwt.verify(token,"supersecret");
         const user = await User.findOne({email:decodedToken.email});
         if(!user){
            return res.status(400).json({
                message: "User not found"
            })
         }
         //checking if user already has a cart
         let cart;
         if(user.cart){
            cart = await Cart.findById(user.cart).populate('products');
            const existingProductsIds =cart.products.map((product)=>{
                  product._id.toString()
            })
            //if product is not allready in the cart, add it to cart
            productArray.forEach(async(productId)=>{
                 if(!existingProductsIds.includes(productId)){
                    cart.products.push(productId);
                    const product = await Product.findById(productId);
                    totalPrice += product.price;
                 }
            })
            //updating cart.total with the new total price
            cart.total = totalPrice;
            await cart.save();
         }else{
            //create new cart
            cart = new Cart({
                products:productArray,
                total: totalPrice
            })
            await cart.save();
            user.cart = cart._id;
            await user.save();
         }
         return res.status(200).json({
            message :"Product added to cart successfully",
            cart:cart
         })
    }catch(eroor){
        console.log(eroor);
        res.status(400).json({
           message:"Internal server error"
        });
    } 
})

//task-10 to create route to delete product in cart
app.delete('/cart/product/delete',async(req,res)=>{
    try{
        const {productID}=req.body;
        const {token}=req.headers;
        const decodedToken = jwt.verify(token,"supersecret");
        const user=await User.findOne({email:decodedToken.email }).populate("cart");
        if(!user){
            return res.status(404).json({
                message:"User not found"
            })
        }
        const cart=await Cart.findById(user.cart).populate("products");
        if(!cart){
            return res.status(404).json({
                message:"cart not found"
            })
        }
        const productIndex=cart.products.findIndex(
            (product)=> product._id.toString() === productID
        )
        if(productIndex === -1){
            return res.status(404).json({
                message:"Product not found in cart"
            })
        }
        cart.products.splice(productIndex, 1)
        cart.total = cart.products.reduce(
            (total,product)=> total + product.price,
            0
        );
        await cart.save();
        return res.status(200).json({
            message:"Product deleted from cart successfully",
            cart: cart
        })
    }catch(eroor){
        console.log(eroor);
        res.status(400).json({
           message:"Internal server error"
        });
    } 
})

let PORT=8080;
app.listen(PORT,()=>{
    console.log(`server is connceted to port ${PORT}`)
})