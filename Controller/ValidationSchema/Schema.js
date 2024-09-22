const yup = require('yup')


//signUp Validation
const registrationSchema = yup.object().shape({
    name: yup.string().required('Username is required'),
    email: yup.string().email('Invalid email format').required('Email is required'),
    password: yup.string().required('Password is required'),
    role:yup.string().oneOf(['tenant', 'landlord', 'manager'], 'Invalid role'),
  })

//login Validation
const loginSchema = yup.object().shape({
  email: yup.string().email('Invalid email format').required('Email is required'),
  password: yup.string().required('Password is required'),
})

module.exports.registrationSchema  = registrationSchema 
module.exports.loginSchema = loginSchema