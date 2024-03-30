/*
    Title: moffatbaydb_initialization
    Authors: Team 1: Taylor Niemann, Ricardo Orlando, Renante Labrador, Michele Speidel, Praveen Theerthagiri
    Date: 3 Feb 2024
    Description: mblodge_booking_system database initialization script.

    New database initialization with 5% increase in room price
    Password upper limit also updated to VARCHAR(255)
*/

-- drop database is exists
DROP database IF EXISTS mblodge_booking_system;

-- create database
CREATE database mblodge_booking_system;
USE mblodge_booking_system;

-- drop database user if exists 
DROP USER IF EXISTS 'MFTeam1'@'localhost';

-- create a username and password to access the mblodge_booking_system database 
CREATE USER 'MFTeam1'@'localhost' IDENTIFIED WITH mysql_native_password BY 'MChiefT3am!';

-- grant all privileges to the mblodge_booking_system database to user MFTeam1 on localhost 
GRANT ALL PRIVILEGES ON mblodge_booking_system.* TO 'MFTeam1'@'localhost';

-- drop tables if they are present
DROP TABLE IF EXISTS customer;
DROP TABLE IF EXISTS comment;
DROP TABLE IF EXISTS roomsize;
DROP TABLE IF EXISTS roompricepernight;
DROP TABLE IF EXISTS guestcapacity;
DROP TABLE IF EXISTS roomdetail;
DROP TABLE IF EXISTS reservations;

-- create the customer table 
CREATE TABLE customer (
    customerid     INT         NOT NULL     AUTO_INCREMENT,
    firstname   VARCHAR(40)     NOT NULL,
    lastname   VARCHAR(40)     NOT NULL,
    email       VARCHAR(45)     NOT NULL     UNIQUE,
    telephone   VARCHAR(14)     NOT NULL,
    password   VARCHAR(255)     NOT NULL     UNIQUE,
     
    PRIMARY KEY(customerid)
); 

-- create the comment table and set the foreign key
CREATE TABLE comment (
    commentid         INT         NOT NULL        AUTO_INCREMENT,
    email          VARCHAR(45)     NOT NULL       UNIQUE,
    comments         VARCHAR(255)    NOT NULL,

    PRIMARY KEY(commentid)
);

-- create the roomsize table
CREATE TABLE roomsize (
    roomsizeid      INT      NOT NULL     AUTO_INCREMENT,
    roomsize     VARCHAR(45)      NOT NULL,
     
    PRIMARY KEY(roomsizeid)
);

-- create the guestcapacity table
CREATE TABLE guestcapacity (
    guestcapacityid     INT      NOT NULL     AUTO_INCREMENT,
    capacityNumber      INT      NOT NULL,
     
    PRIMARY KEY(guestcapacityid)
);

-- create the roompricepernight table
CREATE TABLE roompricepernight (
    roompricepernightid     INT          NOT NULL     AUTO_INCREMENT,
    roompricepernight     DECIMAL(10,2)     NOT NULL,
     
    PRIMARY KEY(roompricepernightid)
);

-- create the roomdetail table and set foreign keys
CREATE TABLE roomdetail (
    roomdetailid           INT     NOT NULL     AUTO_INCREMENT,
    roomsizeid             INT     NOT NULL,
    guestcapacityid        INT     NOT NULL,
    roompricepernightid    INT     NOT NULL,

    PRIMARY KEY(roomdetailid),
    CONSTRAINT fk_roomSize
    FOREIGN KEY(roomsizeid)
        REFERENCES roomsize(roomsizeid),
    CONSTRAINT fk_guestcapacity
    FOREIGN KEY(guestcapacityid)
        REFERENCES guestcapacity(guestcapacityid),
    CONSTRAINT fk_roompricepernight
    FOREIGN KEY(roompricepernightid)
        REFERENCES roompricepernight(roompricepernightid)
);

-- create the reservations table and set the foreign keys
CREATE TABLE reservations (
    reservationsid      INT      NOT NULL     AUTO_INCREMENT,
    roomdetailid       INT      NOT NULL,
    customerid         INT      NOT NULL,
    checkindate    DATETIME      NOT NULL,
    checkoutdate   DATETIME     NOT NULL,
     
    PRIMARY KEY(reservationsid),
    CONSTRAINT fk_roomdetail
    FOREIGN KEY(roomdetailid)
        REFERENCES roomdetail(roomdetailid),
    CONSTRAINT fk_customer
    FOREIGN KEY(customerid)
        REFERENCES customer(customerid)
); 

-- insert three entries into customer table
INSERT INTO customer(customerid, firstname, lastname, email, telephone, password)
VALUES(1, 'Melton', 'Smith', 'msmith@smith.com', '123-456-7891', 'Msmithpass#22');
INSERT INTO customer(customerid, firstname, lastname, email, telephone, password)
VALUES(2, 'James', 'Robinson', 'JamesRob@ysn.com', '000-234-000', 'Passjames111');
INSERT INTO customer(customerid, firstname, lastname, email, telephone, password)
VALUES(3, 'Kelly', 'Brooks', 'kb@realtor.com', '555-253-0101', 'Bighouse24');

-- insert three entries into comment table
INSERT INTO comment()
VALUES(1, 'mrsmith@smith.com', 'Can I upgrade my room from queen to a king and add a guest?');
INSERT INTO comment()
VALUES(2, 'JamesRob@ysn.com', 'Is your lodge pet friendly ');
INSERT INTO comment()
VALUES(3, 'kb@realtor.com', 'Are rollout beds available for the week of March 24th');

-- insert three entries into roomsize table
INSERT INTO roomsize(roomsizeid, roomsize)
VALUES (1, 'Double Full Beds');
INSERT INTO roomsize(roomsizeid, roomsize)
VALUES (2, 'Queen');
INSERT INTO roomsize(roomsizeid, roomsize)
VALUES (3, 'Double Queen Beds');
INSERT INTO roomsize(roomsizeid, roomsize)
VALUES (4, 'King');

-- insert three entries into guestcapacity table
INSERT INTO guestcapacity(guestcapacityid, capacityNumber)
VALUES (1, 1);
INSERT INTO guestcapacity(guestcapacityid, capacityNumber)
VALUES (2, 2);
INSERT INTO guestcapacity(guestcapacityid, capacityNumber)
VALUES (3, 3);
INSERT INTO guestcapacity(guestcapacityid, capacityNumber)
VALUES (4, 4);
INSERT INTO guestcapacity(guestcapacityid, capacityNumber)
VALUES (5, 5);

-- insert three entries into roompricepernight table
INSERT INTO roompricepernight(roompricepernightid, roompricepernight)
VALUES (1, 120.75);
INSERT INTO roompricepernight(roompricepernightid, roompricepernight)
VALUES (2, 157.50);

-- insert three entries into roomdetail table
INSERT INTO roomdetail(roomdetailid, roomsizeid, guestcapacityid, roompricepernightid)
VALUES(1, 1, 1, 1);
INSERT INTO roomdetail(roomdetailid, roomsizeid, guestcapacityid, roompricepernightid)
VALUES(2, 1, 2, 1);
INSERT INTO roomdetail(roomdetailid, roomsizeid, guestcapacityid, roompricepernightid)
VALUES(3, 1, 3, 2);
INSERT INTO roomdetail(roomdetailid, roomsizeid, guestcapacityid, roompricepernightid)
VALUES(4, 1, 4, 2);
INSERT INTO roomdetail(roomdetailid, roomsizeid, guestcapacityid, roompricepernightid)
VALUES(5, 1, 5, 2);
INSERT INTO roomdetail(roomdetailid, roomsizeid, guestcapacityid, roompricepernightid)
VALUES(6, 2, 1, 1);
INSERT INTO roomdetail(roomdetailid, roomsizeid, guestcapacityid, roompricepernightid)
VALUES(7, 2, 2, 1);
INSERT INTO roomdetail(roomdetailid, roomsizeid, guestcapacityid, roompricepernightid)
VALUES(8, 2, 3, 2);
INSERT INTO roomdetail(roomdetailid, roomsizeid, guestcapacityid, roompricepernightid)
VALUES(9, 2, 4, 2);
INSERT INTO roomdetail(roomdetailid, roomsizeid, guestcapacityid, roompricepernightid)
VALUES(10, 2, 5, 2);
INSERT INTO roomdetail(roomdetailid, roomsizeid, guestcapacityid, roompricepernightid)
VALUES(11, 3, 1, 1);
INSERT INTO roomdetail(roomdetailid, roomsizeid, guestcapacityid, roompricepernightid)
VALUES(12, 3, 2, 1);
INSERT INTO roomdetail(roomdetailid, roomsizeid, guestcapacityid, roompricepernightid)
VALUES(13, 3, 3, 2);
INSERT INTO roomdetail(roomdetailid, roomsizeid, guestcapacityid, roompricepernightid)
VALUES(14, 3, 4,2);
INSERT INTO roomdetail(roomdetailid, roomsizeid, guestcapacityid, roompricepernightid)
VALUES(15, 3, 5, 2);
INSERT INTO roomdetail(roomdetailid, roomsizeid, guestcapacityid, roompricepernightid)
VALUES(16, 4, 1, 1);
INSERT INTO roomdetail(roomdetailid, roomsizeid, guestcapacityid, roompricepernightid)
VALUES(17, 4, 2, 1);
INSERT INTO roomdetail(roomdetailid, roomsizeid, guestcapacityid, roompricepernightid)
VALUES(18, 4, 3, 2);
INSERT INTO roomdetail(roomdetailid, roomsizeid, guestcapacityid, roompricepernightid)
VALUES(19, 4, 4, 2);
INSERT INTO roomdetail(roomdetailid, roomsizeid, guestcapacityid, roompricepernightid)
VALUES(20, 4, 5, 2);

-- insert three entries into reservations table
INSERT INTO reservations(reservationsid, customerid, roomdetailid, checkindate, checkoutdate)
VALUES(1, 1, 2, '2024-03-24 00:00:00', '2024-03-30 00:00:00');
INSERT INTO reservations(reservationsid, customerid, roomdetailid, checkindate, checkoutdate)
VALUES(2, 2, 6, '2024-02-14 00:00:00', '2024-02-16 00:00:00');
INSERT INTO reservations(reservationsid, customerid, roomdetailid, checkindate, checkoutdate)
VALUES(3, 3, 15, '2024-02-25 00:00:00', '2024-02-29 00:00:00');