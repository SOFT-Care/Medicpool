drop table if EXISTS Contact,Appointments,Doctor,Patient;
                                    ---------------------------------------------
                                    -------------SOFT_care Sechema---------------
                                    ---------------------------------------------


-----Creating Table Contant-----
CREATE TABLE IF NOT EXISTS Contact (
                            contant_id                SERIAL   PRIMARY KEY     ,--PRIMARY KEY 
                            phone_number              VARCHAR(50)              ,
                            e_mail                    VARCHAR(100)             ,
                            pat_id                    int                      ,--FOREIGN key
                            doc_id                    int                       --FOREIGN key
);

-----Creating Table Appointments-----
CREATE TABLE IF NOT EXISTS Appointments (
                            appoi_id                  SERIAL  PRIMARY KEY      ,--PRIMARY KEY 
                            day                       VARCHAR(50)              ,
                            time_from                 VARCHAR(50)              ,
                            time_to                   VARCHAR(50)              ,
                            pat_id                    int                      ,--FOREIGN key
                            doc_id                    int                       --FOREIGN key
);

-----Creating Table Patient-----
CREATE TABLE IF NOT EXISTS Patient (
                            patient_id               SERIAL   PRIMARY KEY      ,--PRIMARY KEY 
                            patient_first_name        VARCHAR(100)             ,
                            patient_last_name         VARCHAR(100)             ,
                            gender                    VARCHAR(50)              ,
                            date_of_birth             VARCHAR(20)              ,
                            patient_image             VARCHAR(200)             ,
                            patient_password          VARCHAR(100)             
);



-----Creating Table Doctor-----
CREATE TABLE IF NOT EXISTS Doctor (
                            doctor_id                 SERIAL  PRIMARY KEY      ,--PRIMARY KEY
                            doctor_name               VARCHAR(1000)            ,
                            doctor_speciailty         VARCHAR(100)             ,
                            doc_location              VARCHAR(1000)
);

                                ---------------------------------------------
                                -------------ADD CONSTRAINTS-----------------
                                ---------------------------------------------
ALTER TABLE  Appointments ADD CONSTRAINT FK_doc_appo
FOREIGN KEY (doc_id) REFERENCES Doctor(doctor_id);

ALTER TABLE  Contact ADD CONSTRAINT FK_doc_cont
FOREIGN KEY (doc_id) REFERENCES Doctor(doctor_id);

ALTER TABLE  Contact ADD CONSTRAINT FK_pat_cont
FOREIGN KEY (pat_id) REFERENCES Patient(patient_id);   

ALTER TABLE  Appointments ADD CONSTRAINT FK_pat_appo
FOREIGN KEY (pat_id) REFERENCES Patient(patient_id);
                               ---------------------------------------------
                                --------------------COMMIT -----------------
                                ---------------------------------------------