                                    ---------------------------------------------
                                    -------------SOFT_care Sechema---------------
                                    ---------------------------------------------


-----Creating Table Contant-----
CREATE TABLE IF NOT EXISTS Contact (
                            contant_id                SERIAL   PRIMARY KEY     ,--PRIMARY KEY 
                            phone_number              INT                      ,
                            e_mail                    VARCHAR(100)             
);

-----Creating Table Appointments-----
CREATE TABLE IF NOT EXISTS Appointments (
                            appoi_id                  SERIAL  PRIMARY KEY      ,--PRIMARY KEY 
                            day                       DATE                     ,
                            time_from                 DATE                     ,
                            time_to                   DATE                     ,
                            notes                     VARCHAR(200) 

);

-----Creating Table Patient-----
CREATE TABLE IF NOT EXISTS Patient (
                            patient_id               SERIAL   PRIMARY KEY      ,--PRIMARY KEY 
                            patient_first_name        VARCHAR(100)             ,
                            patient_last_name         VARCHAR(100)             ,
                            gender                    VARCHAR(50)              ,
                            date_of_birth             DATE                     ,
                            patient_image             VARCHAR(200)             ,
                            patient_password          VARCHAR(100)             ,
                            appointment_id            INT                      ,--FOREIGN KEY
                            cont_id                   INT                       --FOREIGN KEY
);

                                ---------------------------------------------
                                -------------ADD CONSTRAINTS-----------------
                                ---------------------------------------------

ALTER TABLE  Patient ADD CONSTRAINT FK_pat_appo
FOREIGN KEY (appointment_id) REFERENCES Appointments(appoi_id);

ALTER TABLE  Patient ADD CONSTRAINT FK_pat_con
FOREIGN KEY (cont_id ) REFERENCES Contact(contant_id);



                         

-----Creating Table Doctor-----
CREATE TABLE IF NOT EXISTS Doctor (
                            doctor_id                 SERIAL  PRIMARY KEY      ,--PRIMARY KEY
                            doctor_first_name         VARCHAR(100)             ,
                            doctor_last_name          VARCHAR(100)             ,
                            doctor_speciailty         VARCHAR(100)             ,
                            doctor_availability       BOOlEAN                  ,
                            cont_id                   INT                      ,--FOREIGN KEY
                            patient_id                INT                      ,--FOREIGN KEY
                            appointment_id            INT                       --FOREIGN KEY
);

                                ---------------------------------------------
                                -------------ADD CONSTRAINTS-----------------
                                ---------------------------------------------

ALTER TABLE  Doctor ADD CONSTRAINT FK_doc_cont
FOREIGN KEY (cont_id ) REFERENCES Contact(contant_id);

ALTER TABLE  Doctor ADD CONSTRAINT FK_doc_pat
FOREIGN KEY (patient_id) REFERENCES Patient(patient_id);   


ALTER TABLE  Doctor ADD CONSTRAINT FK_doc_appo
FOREIGN KEY (appointment_id) REFERENCES Appointments(appoi_id); 

                            
                               ---------------------------------------------
                                --------------------COMMIT -----------------
                                ---------------------------------------------