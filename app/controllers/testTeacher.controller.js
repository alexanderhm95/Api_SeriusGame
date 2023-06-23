const TestTeacher = require('../models/testTeacher.model.js');
const Person = require('../models/person.model.js');
const Teacher = require('../models/teacher.model.js');
const Student = require('../models/student.model.js');
const Caso = require('../models/caso.model.js');
const Institution = require('../models/institution.model.js');

exports.findAll = async (req, res) => {
    console.log("llegue.. al test teacher")
    try{
        let listaTest = [];
        const testTeacher = await TestTeacher.find()
        console.log("Mostrar testTeacher",testTeacher)

        for(let i=0; i < testTeacher.length; i++){
            const test = testTeacher[i];
            console.log(testTeacher[i])

            let teacher = await Teacher.findOne({_id:test.teacher});
            console.log(teacher)
            let teacherPerson = null;
            if(teacher){
                teacherPerson = await Person.findOne({_id:teacher.person});
            }
            console.log("Mostrar la persona del teacher ",teacherPerson)

            console.log("Mostrar codigo",test.student)
            let student = await Student.findOne({ _id: test.student});
            console.log("Mostrar el estudiante",student)
            let studentPerson = null;
            if(student){
                studentPerson = await Person.findOne({_id: student.person});
            }
            console.log("Mostrar la persona del estudiante ",studentPerson)

            listaTest.push({
                _id: test._id,
                ciTeacher: teacherPerson ? teacherPerson.CI : "No asignado",
                nameTeacher: teacherPerson ? teacherPerson.name : "No asignado",
                lastNameTeacher: teacherPerson ? teacherPerson.lastName : "No asignado",
                ciStudent: studentPerson ? studentPerson.CI : "No asignado",
                nameStudent: studentPerson ? studentPerson.name : "No asignado",
                lastNameStudent: studentPerson ? studentPerson.lastName : "No asignado",
                score: test.score,
                status: test.status,
                createdAt: test.createdAt
            });

        }
        res.status(200).send(listaTest);

    } catch (error) {
    
        res.status(400).send({ error: error + "Error finding testTeacher" });
    }
};

exports.getTestTeacher = async (req, res) => {
    try{
        const test = await TestTeacher.findById(req.params.id)
        
        res.status(200).send(test);
    } catch(error){
        res.status(400).send({ error: error + "Error finding testTeacher" });
    }
}


exports.deleteOne = async (req, res) => {
    try{

        const testTeacher = await TestTeacher.deleteOne({_id: req.params.id})
        console.log("Mostrar testTeacher",testTeacher)
        const caso = await Caso.findOne({testTeacher: req.params.id})
        console.log("Mostrar caso",caso)
        caso.statusTestTeacher = "active"
        console.log("Mostrar caso editado ",caso);
        await caso.save();
        res.status(200).send(testTeacher);
    } catch(error){
        console.log(error)
        res.status(400).send({ error: error + "Error deleting testTeacher" });
    }
}