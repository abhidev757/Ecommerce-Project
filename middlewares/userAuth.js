const isUser = (req,res,next)=>{
    if(req.session.user || req.user){
        next()
    }else{
        res.redirect("/userLogin")
    }

}

module.exports = isUser;