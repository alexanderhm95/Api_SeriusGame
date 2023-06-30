const TestImages = require('../models/testImages.model');
const { resolve } = require('path');
const fs = require('fs');

// Create and Save a new TestImages
exports.create = async (req, res) => {
    let srcImageTmp = ""; // Inicializar la variable srcImageTmp
    console.log(req.body)

    try {
        const { data } = req.body;
        const testImages = JSON.parse(data);
        const test = new TestImages({
            name: testImages.name,
            link: testImages.urlImage,
            value: testImages.value,
            section: testImages.section,
        })
        srcImageTmp = testImages.urlImage;
         await test.save();
        res.status(201).send({ message: "ok", test });
    } catch (error) {
        // si ocurre un error, se elimina la imagen subida
        if (srcImageTmp) { // Verificar que srcImageTmp tenga un valor antes de usarlo
            const deleteFile = resolve(__dirname, '..', '..', srcImageTmp);
            console.log(deleteFile);
            fs.access(deleteFile, fs.constants.F_OK, (err) => {
                if (!err) {
                    fs.unlink(deleteFile, (err) => {
                        console.log('file was deleted');
                    });
                } else {
                    console.log('file does not exist');
                }
            });
        }

        console.log(error);
        res.status(400).send({ error: error + "Error creating TestImages" });
    }
};



const options = {
    page: 1,
    limit: 3,
};

exports.findAllPaginated = async (req, res) => {
    try {
        const { page, limit } = req.query;
        options.page = page ? page : 2;
        options.limit = limit ? limit : 3;

        const testImages = await TestImages.paginate({}, options, function (err, result) {
            res.status(200).send({ message: "ok", data: result });
        });
    } catch (error) {
        res.status(400).send({ error: error + "Error getting TestImages" });
    }
}

// Retrieve and return all testImages from the database.
exports.findAll = async (req, res) => {
    try {
        const testImages = await TestImages.find();
        res.status(200).send({ message: "ok", data: testImages });
    } catch (error) {
        res.status(400).send({ error: error + "Error getting TestImages" });
    }
}

// Find a single testImages with a testImagesId
exports.findOne = async (req, res) => {
    try {
        const testImages = await TestImages.findById(req.params.id);
        if (!testImages) {
            return res.status(400).send({ error: 'TestImages not found' });
        }
        res.status(200).send(testImages);
    } catch (error) {
        res.status(400).send({ error: error + "Error getting TestImages" });
    }
}

// Update a testImages identified by the testImagesId in the request
exports.update = async (req, res) => {
    let srcImageTmp = "";
    let srcImageTmp2 = "";
    try {
        const { data } = req.body
        //aqui se trae el link de la imagen anterior para eliminarla
        const testImagesOld = await TestImages.findById(req.params.id);
        srcImageTmp2 = testImagesOld.link;

        const testImages = await TestImages.findByIdAndUpdate(req.params.id,
            JSON.parse(data)
            , { new: true });
        srcImageTmp = testImages.link;
        console.log(testImages.link)
        console.log(testImagesOld.link)
        //se comprueba si la imagen existe para eliminarla
        const deleteFile = resolve(__dirname, '..', '..', srcImageTmp2);
        console.log(deleteFile)
        fs.access(deleteFile, fs.constants.F_OK, (err) => {
            if (!err) {
                fs.unlink(deleteFile, (err) => {
                    console.log('file was deleted old');
                });
            } else {
                console.log('file does not exist');
            }
        });

        res.status(200).send(testImages);
    } catch (error) {
        //se comprueba si la imagen existe para eliminarla
        const deleteFile = resolve(__dirname, '..', '..', srcImageTmp);
        console.log(deleteFile)
        fs.access(deleteFile, fs.constants.F_OK, (err) => {
            if (!err) {
                fs.unlink(deleteFile, (err) => {
                    console.log('file was deleted new');
                });
            } else {
                console.log('file does not exist');
            }
        });
        console.log(error)
        res.status(400).send({ error: error + "Error updating TestImages" });
    }
}

// Delete a testImages with the specified testImagesId in the request
exports.delete = async (req, res) => {
    try {
        const testImages = await TestImages.findByIdAndRemove(req.params.id);

        //se comprueba si la imagen existe para eliminarla
        const deleteFile = resolve(__dirname, '..', '..', testImages.link);

        fs.access(deleteFile, fs.constants.F_OK, (err) => {
            if (!err) {
                fs.unlink(deleteFile, (err) => {
                    console.log('file was deleted');
                });
            } else {
                console.log('file does not exist');
            }
        });

        res.status(200).send({ message: "TestImages deleted successfully!", testImages });
    } catch (error) {
        res.status(400).send({ error: error + "Error deleting TestImages" });
    }
}

// // Delete all testImages from the database.
exports.deleteAll = async (req, res) => {
    try {
        await TestImages.deleteMany({});
        res.status(200).send({ message: "All TestImages deleted successfully!" });
    } catch (error) {
        res.status(400).send({ error: error + "Error deleting TestImages" });
    }
}