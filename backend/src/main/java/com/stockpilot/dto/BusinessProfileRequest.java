package com.stockpilot.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class BusinessProfileRequest {

    @NotBlank(message = "Business name is required")
    @Size(max = 150, message = "Business name must not exceed 150 characters")
    private String name;

    @Size(max = 255, message = "Address must not exceed 255 characters")
    private String address;

    @Pattern(regexp = "^(?:(?:\\+91|0)?[6-9]\\d{9})?$", message = "Please enter a valid 10-digit mobile number")
    private String phone;

    @Email(message = "Please enter a valid email address")
    @Size(max = 150, message = "Email must not exceed 150 characters")
    private String email;

    @Size(max = 20, message = "GSTIN must not exceed 20 characters")
    private String gstin;

    public BusinessProfileRequest() {
    }

    public BusinessProfileRequest(String name, String address, String phone, String email, String gstin) {
        this.name = name;
        this.address = address;
        this.phone = phone;
        this.email = email;
        this.gstin = gstin;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getGstin() {
        return gstin;
    }

    public void setGstin(String gstin) {
        this.gstin = gstin;
    }
}
