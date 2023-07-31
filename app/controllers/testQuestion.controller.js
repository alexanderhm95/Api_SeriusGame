const TestQuestion = require('../models/testQuestion.model.js');

// Create and Save a new TestQuestion
exports.create = async (req, res) => {
    console.log(req.body)    
    try {
        const { nameQuestion, descriptionQuestion, answer } = req.body;
        const testQuestion = new TestQuestion({
            nameQuestion,
            descriptionQuestion,
            answer
        });
        await testQuestion.save();
        res.status(201).send({ message: "Pregunta cargada al Test Docente!", testQuestion });
    } catch (error) {
        console.log(error)
        res.status(400).send({ error: error + "Error al cargar pregunta de  Test Docente" });
    }
}

// Retrieve and return all testQuestions from the database.
exports.findAll = async (req, res) => {
    try {
        const testQuestions = await TestQuestion.find();

        res.status(200).send({ message: "Preguntas cargadas con éxito", data: testQuestions });
    } catch (error) {
        res.status(400).send({ error: error + "Error getting TestQuestion" });
    }
}

// Find a single testQuestion with a testQuestionId
exports.findOne = async (req, res) => {
    try {
        const testQuestion = await TestQuestion.findById(req.params.id);
        if (!testQuestion) {
            return res.status(400).send({ error: 'TestQuestion not found' });
        }
        res.status(200).send(testQuestion);
    } catch (error) {
        res.status(400).send({ error: error + "Error getting TestQuestion" });
    }
}

// Update a testQuestion identified by the testQuestionId in the request
exports.update = async (req, res) => {
    try {
        const { nameQuestion, descriptionQuestion, answer } = req.body;
        const testQuestion = await TestQuestion.findByIdAndUpdate(req.params.id, {
            nameQuestion,
            descriptionQuestion,
            answer
        }, { new: true });
        if (!testQuestion) {
            return res.status(400).send({ error: 'TestQuestion not found' });
        }
        res.status(200).send({ message: "Pregunta del Test Docente actualizada!", testQuestion });
    } catch (error) {
        res.status(400).send({ error: error + "Error updating TestQuestion" });
    }
}

// Delete a testQuestion with the specified testQuestionId in the request
exports.delete = async (req, res) => {
    try {
        const testQuestion = await TestQuestion.findByIdAndRemove(req.params.id);
        if (!testQuestion) {
            return res.status(400).send({ error: 'TestQuestion not found' });
        }
        res.status(200).send({ message: "Pregunta del Test Docente eliminada correctamente" });
    } catch (error) {
        res.status(400).send({ error: error + "Error al eliminar pregunta del Test Docente" });
    }
}

// Delete all testQuestions from the database.
exports.deleteAll = async (req, res) => {
    try {
        await TestQuestion.deleteMany();
        res.status(200).send({ message: "Eliminar todas las preguntas del docente!" });
    } catch (error) {
        res.status(400).send({ error: error + "Error al eliminar los Test Docente" });
    }
}