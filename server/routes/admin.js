/* eslint-disable no-unused-vars */
/* eslint-disable import/named */
import {
	AuthenticationControllers,
	AdminControllers,
	ChatControllers,
	ItineraryControllers,
	ReservationControllers,
	TransportationControllers,
	TripControllers,
	NoteControllers,
} from '../controllers';
import { MultipartService } from '../services';

const prefix = '/api/admin/';
/**
 * @description
 * This is the route handler for the admin.
 * @author Santgurlal Singh
 * @since 12 Jan, 2021
 */

export default (app) => {
	app.post(`${prefix}signup`, AdminControllers.signup);
	app.post(`${prefix}login`, AdminControllers.login);
	app.post(`${prefix}dashboard`, AuthenticationControllers.authenticateAdmin, AdminControllers.dashboard);
	app.post(`${prefix}userList`, AuthenticationControllers.authenticateAdmin, AdminControllers.userList);
	app.post(`${prefix}specialistList`, AuthenticationControllers.authenticateAdmin, AdminControllers.specialistList);
	app.post(`${prefix}editUser`, AuthenticationControllers.authenticateAdmin, AdminControllers.editUser);
	app.post(`${prefix}itinerariesList`, AuthenticationControllers.authenticateAdmin, AdminControllers.itinerariesList);
	app.post(`${prefix}userDetails`, AuthenticationControllers.authenticateAdmin, AdminControllers.userDetails);
	app.post(`${prefix}getChannel`, AuthenticationControllers.authenticateAdmin, ChatControllers.getChannel);
	app.post(`${prefix}chatList`, AuthenticationControllers.authenticateAdmin, ChatControllers.chatList);
	app.post(`${prefix}chatImage`, MultipartService, AuthenticationControllers.authenticateAdmin, ChatControllers.chatImage);
	app.post(`${prefix}messageList`, AuthenticationControllers.authenticateAdmin, ChatControllers.messageList);
	app.post(`${prefix}unread`, AuthenticationControllers.authenticateAdmin, ChatControllers.unread);
	app.post(`${prefix}createSpecialist`, MultipartService, AuthenticationControllers.authenticateAdmin, AdminControllers.createSpecialist);
	app.post(`${prefix}editSpecialist`, MultipartService, AuthenticationControllers.authenticateAdmin, AdminControllers.editSpecialist);
	app.post(`${prefix}deleteSpecialist`, AuthenticationControllers.authenticateAdmin, AdminControllers.deleteSpecialist);
	app.post(`${prefix}accessSpecialistList`, AuthenticationControllers.authenticateAdmin, AdminControllers.accessSpecialistList);
	app.post(`${prefix}specialistActions`, AuthenticationControllers.authenticateAdmin, AdminControllers.specialistActions);
	app.post(`${prefix}assignSpecialist`, AuthenticationControllers.authenticateAdmin, AdminControllers.assignSpecialist);
	app.post(`${prefix}add`, MultipartService, AuthenticationControllers.authenticateAdmin, ItineraryControllers.add);
	app.post(`${prefix}edit`, MultipartService, AuthenticationControllers.authenticateAdmin, ItineraryControllers.edit);
	app.post(`${prefix}complete`, AuthenticationControllers.authenticateAdmin, ItineraryControllers.complete);
	app.post(`${prefix}details`, AuthenticationControllers.authenticateAdmin, ItineraryControllers.details);
	app.post(`${prefix}submit`, AuthenticationControllers.authenticateAdmin, ItineraryControllers.submit);
	app.post(`${prefix}cancel`, AuthenticationControllers.authenticateAdmin, ItineraryControllers.cancel);
	app.post(`${prefix}addAccommodation`, MultipartService, AuthenticationControllers.authenticateAdmin, ReservationControllers.addAccommodation);
	app.post(`${prefix}editAccommodation`, MultipartService, AuthenticationControllers.authenticateAdmin, ReservationControllers.editAccommodation);
	app.post(`${prefix}addRestaurant`, MultipartService, AuthenticationControllers.authenticateAdmin, ReservationControllers.addRestaurant);
	app.post(`${prefix}editRestaurant`, MultipartService, AuthenticationControllers.authenticateAdmin, ReservationControllers.editRestaurant);
	app.post(`${prefix}addActivity`, MultipartService, AuthenticationControllers.authenticateAdmin, ReservationControllers.addActivity);
	app.post(`${prefix}editActivity`, MultipartService, AuthenticationControllers.authenticateAdmin, ReservationControllers.editActivity);
	app.post(`${prefix}deleteReservation`, AuthenticationControllers.authenticateAdmin, ReservationControllers.delete);
	app.post(`${prefix}reservationList`, AuthenticationControllers.authenticateAdmin, ReservationControllers.list);
	app.post(`${prefix}addFlight`, AuthenticationControllers.authenticateAdmin, TransportationControllers.addFlight);
	app.post(`${prefix}editFlight`, AuthenticationControllers.authenticateAdmin, TransportationControllers.editFlight);
	app.post(`${prefix}addTrainFerry`, AuthenticationControllers.authenticateAdmin, TransportationControllers.addTrainFerry);
	app.post(`${prefix}editTrainferry`, AuthenticationControllers.authenticateAdmin, TransportationControllers.editTrainFerry);
	app.post(`${prefix}addCar`, AuthenticationControllers.authenticateAdmin, TransportationControllers.addCar);
	app.post(`${prefix}editCar`, AuthenticationControllers.authenticateAdmin, TransportationControllers.editCar);
	app.post(`${prefix}upload`, MultipartService, AuthenticationControllers.authenticateAdmin, TransportationControllers.upload);
	app.post(`${prefix}deleteTransportation`, AuthenticationControllers.authenticateAdmin, TransportationControllers.delete);
	app.post(`${prefix}transportationList`, AuthenticationControllers.authenticateAdmin, TransportationControllers.list);
	app.post(`${prefix}tripList`, AuthenticationControllers.authenticateAdmin, TripControllers.list);
	app.post(`${prefix}addNote`, MultipartService, AuthenticationControllers.authenticateAdmin, NoteControllers.add);
	app.post(`${prefix}editNote`, MultipartService, AuthenticationControllers.authenticateAdmin, NoteControllers.edit);
	app.post(`${prefix}deleteNote`, AuthenticationControllers.authenticateAdmin, NoteControllers.delete);
	app.post(`${prefix}noteList`, AuthenticationControllers.authenticateAdmin, NoteControllers.list);
	app.post(`${prefix}dayList`, AuthenticationControllers.authenticateAdmin, TripControllers.dayList);
};
