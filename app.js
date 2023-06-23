//dotenv permite cargar variables de entorno
require('dotenv').config();
//compression permite comprimir las respuestas del servidor
const compression = require('compression');
//permite crear el servidor
const express = require('express');
//morgan permite ver las peticiones que se hacen al servidor
const morgan = require('morgan');
//json permite recibir y enviar datos en formato json
const bodyParser = require('body-parser');
//permite resolver errores de origen cruzado
const cors = require('cors');
//importa la conexión a la base de datos
const dbConnection = require('./config/mongo.conf');
//permite manejar las rutas
const path = require('path');
//crea el servidor
const app = express();
//se carga morganBody para ver las peticiones que se hacen al servidor
const morganBody = require('morgan-body');
const loggerStream = require('./app/utils/helpers/handleLogger');


//middlewares
app.use(cors());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//morganBody permite ver las peticiones que se hacen al servidor
morganBody(app, {
    noColors: true, // Desactiva los colores
    stream: loggerStream, // Establece el stream de salida
    skip: function (req, res) { // Permite omitir peticiones
         return res.statusCode < 201 // Solo muestra peticiones con código de estado 400 o superior
    }
});
//establecemos public como carpeta publica para el servidor
app.use('/api/1.0/public', express.static(path.resolve('public')));

//definimos el puerto
const port = process.env.PORT || 3001;

//ponemos en modo escucha el servidor
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

//inicializamos la conexión a la base de datos
dbConnection.dbConnection();

//importamos las rutas
const personRoutes = require('./app/routes/person.routes');
app.use('/api/1.0/person', personRoutes);

const userRoutes = require('./app/routes/user.routes');
app.use('/api/1.0/user', userRoutes);

const studentRoutes = require('./app/routes/student.routes');
app.use('/api/1.0/student', studentRoutes);

const institutionRoutes = require('./app/routes/institution.routes');
app.use('/api/1.0/institution', institutionRoutes);

const deceRoutes = require('./app/routes/dece.routes');
app.use('/api/1.0/dece', deceRoutes);

const teacherRoutes = require('./app/routes/teacher.routes');
app.use('/api/1.0/teacher', teacherRoutes);

const authRoutes = require('./app/routes/auth.routes');
app.use('/api/1.0/auth', authRoutes);

const testImagesRoutes = require('./app/routes/testImages.routes');
app.use('/api/1.0/testImages', testImagesRoutes);

const testQuestionsRoutes = require('./app/routes/testQuestion.routes');
app.use('/api/1.0/testQuestion', testQuestionsRoutes);

const casesRoutes = require('./app/routes/caso.routes');
app.use('/api/1.0/caso', casesRoutes);

const testTeacherRoutes = require('./app/routes/testTeacher.routes');
app.use('/api/1.0/testTeacher', testTeacherRoutes);

const testStudentRoutes = require('./app/routes/testStudent.routes');
app.use('/api/1.0/testStudent', testStudentRoutes);