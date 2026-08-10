package api

import (
	"fmt"
	"net/http"

	"github.com/ItsAdventureTime/bridge-lemans/backend/internal/policy"
	"github.com/ItsAdventureTime/bridge-lemans/backend/internal/repository"
)

type createCustomerReq struct {
	Customer struct {
		CustomerNo string `json:"customerNo"`
		Name       string `json:"name"`
		Tin        string `json:"tin"`
		Address    string `json:"address"`
		Phone      string `json:"phone"`
		Email      string `json:"email"`
	} `json:"customer"`
	Vehicle struct {
		PlateNo    string `json:"plateNo"`
		VinChassis string `json:"vinChassis"`
		EngineNo   string `json:"engineNo"`
		MakeModel  string `json:"makeModel"`
		Year       string `json:"year"`
		Color      string `json:"color"`
		Odometer   *int32 `json:"odometer"`
	} `json:"vehicle"`
}

func (d *deps) handleListCustomers(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	customers, err := d.queries.ListCustomers(ctx)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	respondJSON(w, http.StatusOK, customers)
}

func (d *deps) handleGetCustomer(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := idParam(r, "id")
	customer, err := d.queries.GetCustomer(ctx, id)
	if err != nil {
		respondError(w, http.StatusNotFound, err)
		return
	}
	respondJSON(w, http.StatusOK, customer)
}

func (d *deps) handleCreateCustomer(w http.ResponseWriter, r *http.Request) {
	if err := requirePermission(r.Context(), policy.CustomerCreate); err != nil {
		respondError(w, http.StatusForbidden, err)
		return
	}
	var req createCustomerReq
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err)
		return
	}
	c := req.Customer
	v := req.Vehicle
	ctx := r.Context()

	if _, err := d.queries.GetCustomerByNo(ctx, c.CustomerNo); err == nil {
		respondError(w, http.StatusConflict, fmt.Errorf("customer number %s already exists", c.CustomerNo))
		return
	}
	if _, err := d.queries.GetVehicleByPlate(ctx, v.PlateNo); err == nil {
		respondError(w, http.StatusConflict, fmt.Errorf("plate number %s already exists", v.PlateNo))
		return
	}

	customer, err := d.queries.CreateCustomer(ctx, repository.CreateCustomerParams{
		CustomerNo: c.CustomerNo,
		Name:       c.Name,
		Tin:        strPtr(c.Tin),
		Address:    strPtr(c.Address),
		Phone:      strPtr(c.Phone),
		Email:      strPtr(c.Email),
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	var odometer int32
	if v.Odometer != nil {
		odometer = *v.Odometer
	}
	vehicle, err := d.queries.CreateVehicle(ctx, repository.CreateVehicleParams{
		CustomerID: customer.ID,
		PlateNo:    v.PlateNo,
		VinChassis: strPtr(v.VinChassis),
		EngineNo:   strPtr(v.EngineNo),
		MakeModel:  v.MakeModel,
		Year:       strPtr(v.Year),
		Color:      strPtr(v.Color),
		Odometer:   &odometer,
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	respondJSON(w, http.StatusCreated, map[string]any{"customer": customer, "vehicle": vehicle})
}

func (d *deps) handleUpdateCustomer(w http.ResponseWriter, r *http.Request) {
	if err := requirePermission(r.Context(), policy.CustomerCreate); err != nil {
		respondError(w, http.StatusForbidden, err)
		return
	}
	var req createCustomerReq
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err)
		return
	}
	id := idParam(r, "id")
	c := req.Customer
	customer, err := d.queries.UpdateCustomer(r.Context(), repository.UpdateCustomerParams{
		ID:         id,
		Name:       c.Name,
		Tin:        strPtr(c.Tin),
		Address:    strPtr(c.Address),
		Phone:      strPtr(c.Phone),
		Email:      strPtr(c.Email),
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	respondJSON(w, http.StatusOK, customer)
}

func (d *deps) handleListVehiclesByCustomer(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := idParam(r, "id")
	vehicles, err := d.queries.ListVehiclesByCustomer(ctx, id)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	respondJSON(w, http.StatusOK, vehicles)
}

func (d *deps) handleCreateVehicle(w http.ResponseWriter, r *http.Request) {
	if err := requirePermission(r.Context(), policy.CustomerCreate); err != nil {
		respondError(w, http.StatusForbidden, err)
		return
	}
	var req createCustomerReq
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err)
		return
	}
	v := req.Vehicle
	customerID := idParam(r, "id")
	ctx := r.Context()
	if _, err := d.queries.GetVehicleByPlate(ctx, v.PlateNo); err == nil {
		respondError(w, http.StatusConflict, fmt.Errorf("plate number %s already exists", v.PlateNo))
		return
	}
	var odometer int32
	if v.Odometer != nil {
		odometer = *v.Odometer
	}
	vehicle, err := d.queries.CreateVehicle(ctx, repository.CreateVehicleParams{
		CustomerID: customerID,
		PlateNo:    v.PlateNo,
		VinChassis: strPtr(v.VinChassis),
		EngineNo:   strPtr(v.EngineNo),
		MakeModel:  v.MakeModel,
		Year:       strPtr(v.Year),
		Color:      strPtr(v.Color),
		Odometer:   &odometer,
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	respondJSON(w, http.StatusCreated, vehicle)
}

func (d *deps) handleGetVehicle(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := idParam(r, "id")
	vehicle, err := d.queries.GetVehicle(ctx, id)
	if err != nil {
		respondError(w, http.StatusNotFound, err)
		return
	}
	respondJSON(w, http.StatusOK, vehicle)
}

func strPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func int64Ptr(i int64) *int64 {
	if i == 0 {
		return nil
	}
	return &i
}
